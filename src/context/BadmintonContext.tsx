import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Match, Team, Player } from '@/types/badminton';
import { saveGameHistory, updatePlayerStats } from '@/utils/supabaseDB';
import { useToast } from "@/components/ui/use-toast";

interface BadmintonContextType {
  match: Match;
  createMatch: (winningScore: number) => void;
  resetMatch: () => void;
  updateTeamName: (teamId: string, name: string) => void;
  updatePlayerName: (teamId: string, playerId: string, name: string) => void;
  incrementScore: (teamId: string) => void;
  decrementScore: (teamId: string) => void;
  completeMatch: () => void;
  setWinningScore: (score: number) => void;
  toggleMatchType: () => void;
  isSingles: boolean;
}

const defaultPlayers = (isHomeTeam: boolean): Player[] => [
  {
    id: uuidv4(), 
    name: isHomeTeam ? 'Player 1' : 'Player 3',
    isServing: isHomeTeam,
    isReceiving: !isHomeTeam
  },
  { 
    id: uuidv4(), 
    name: isHomeTeam ? 'Player 2' : 'Player 4'
  }
];

const createDefaultMatch = (): Match => ({
  id: uuidv4(),
  date: new Date().toISOString(),
  homeTeam: {
    id: uuidv4(),
    name: 'Home Team',
    players: defaultPlayers(true),
    score: 0,
    color: 'bg-gradient-home',
    isHomeTeam: true
  },
  guestTeam: {
    id: uuidv4(),
    name: 'Guest Team',
    players: defaultPlayers(false),
    score: 0,
    color: 'bg-gradient-guest',
    isHomeTeam: false
  },
  winningScore: 21,
  completed: false
});

const BadmintonContext = createContext<BadmintonContextType | undefined>(undefined);

export const BadmintonProvider = ({ children }: { children: React.ReactNode }) => {
  const [match, setMatch] = useState<Match>(createDefaultMatch());
  const [isSingles, setIsSingles] = useState<boolean>(false);
  const { toast } = useToast();

  const createMatch = (winningScore: number) => {
    const newMatch = createDefaultMatch();
    newMatch.winningScore = winningScore;
    setMatch(newMatch);
  };

  const resetMatch = () => {
    const { homeTeam, guestTeam } = match;
    
    setMatch({
      ...createDefaultMatch(),
      homeTeam: {
        ...match.homeTeam,
        score: 0,
        players: match.homeTeam.players.map((player, idx) => ({
          ...player,
          isServing: idx === 0 && match.homeTeam.isHomeTeam,
          isReceiving: idx === 0 && !match.homeTeam.isHomeTeam
        }))
      },
      guestTeam: {
        ...match.guestTeam,
        score: 0,
        players: match.guestTeam.players.map((player, idx) => ({
          ...player,
          isServing: idx === 0 && match.guestTeam.isHomeTeam,
          isReceiving: idx === 0 && !match.guestTeam.isHomeTeam
        }))
      },
      winningScore: match.winningScore
    });
    
    toast({
      title: "Match Reset",
      description: "The match has been reset. Scores are back to 0.",
    });
  };

  const updateTeamName = (teamId: string, name: string) => {
    setMatch(prev => {
      if (prev.homeTeam.id === teamId) {
        return { ...prev, homeTeam: { ...prev.homeTeam, name } };
      } else if (prev.guestTeam.id === teamId) {
        return { ...prev, guestTeam: { ...prev.guestTeam, name } };
      }
      return prev;
    });
  };

  const updatePlayerName = (teamId: string, playerId: string, name: string) => {
    setMatch(prev => {
      if (prev.homeTeam.id === teamId) {
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: prev.homeTeam.players.map(p => 
              p.id === playerId ? { ...p, name } : p
            )
          }
        };
      } else if (prev.guestTeam.id === teamId) {
        return {
          ...prev,
          guestTeam: {
            ...prev.guestTeam,
            players: prev.guestTeam.players.map(p => 
              p.id === playerId ? { ...p, name } : p
            )
          }
        };
      }
      return prev;
    });
  };

  const updateServeReceive = async (isHomeTeamPoint: boolean) => {
    setMatch(prev => {
      if (isSingles) {
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: prev.homeTeam.players.map((p, idx) => ({
              ...p,
              isServing: isHomeTeamPoint,
              isReceiving: !isHomeTeamPoint,
            })).slice(0, 1),
          },
          guestTeam: {
            ...prev.guestTeam,
            players: prev.guestTeam.players.map((p, idx) => ({
              ...p,
              isServing: !isHomeTeamPoint,
              isReceiving: isHomeTeamPoint,
            })).slice(0, 1),
          }
        };
      }
      
      const nextServingPlayerIdx = (prev.homeTeam.score + prev.guestTeam.score) % 4 < 2 ? 0 : 1;
      const nextReceivingPlayerIdx = ((prev.homeTeam.score + prev.guestTeam.score) % 4 < 2) ? 0 : 1;
      
      const updatedHomeTeam = {
        ...prev.homeTeam,
        players: prev.homeTeam.players.map((p, idx) => ({
          ...p,
          isServing: isHomeTeamPoint && idx === nextServingPlayerIdx,
          isReceiving: !isHomeTeamPoint && idx === nextReceivingPlayerIdx
        }))
      };
      
      const updatedGuestTeam = {
        ...prev.guestTeam,
        players: prev.guestTeam.players.map((p, idx) => ({
          ...p,
          isServing: !isHomeTeamPoint && idx === nextServingPlayerIdx,
          isReceiving: isHomeTeamPoint && idx === nextReceivingPlayerIdx
        }))
      };
      
      return {
        ...prev,
        homeTeam: updatedHomeTeam,
        guestTeam: updatedGuestTeam
      };
    });
  };

  const toggleMatchType = () => {
    setIsSingles(prev => !prev);
    
    setMatch(prev => {
      const newMatchType = !isSingles;
      
      if (newMatchType) {
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: prev.homeTeam.players.slice(0, 1)
          },
          guestTeam: {
            ...prev.guestTeam,
            players: prev.guestTeam.players.slice(0, 1)
          }
        };
      } else {
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: prev.homeTeam.players.length < 2 
              ? [...prev.homeTeam.players, { id: uuidv4(), name: 'Player 2' }] 
              : prev.homeTeam.players
          },
          guestTeam: {
            ...prev.guestTeam,
            players: prev.guestTeam.players.length < 2 
              ? [...prev.guestTeam.players, { id: uuidv4(), name: 'Player 4' }] 
              : prev.guestTeam.players
          }
        };
      }
    });
    
    toast({
      title: !isSingles ? "Singles Mode" : "Doubles Mode",
      description: !isSingles 
        ? "Switched to singles match mode." 
        : "Switched to doubles match mode."
    });
  };

  const checkWinner = (matchToCheck: Match): Team | undefined => {
    const { homeTeam, guestTeam, winningScore } = matchToCheck;
    
    if (homeTeam.score === winningScore) {
      return homeTeam;
    }
    if (guestTeam.score === winningScore) {
      return guestTeam;
    }
    
    if (winningScore === 21) {
      if (homeTeam.score >= 20 && guestTeam.score >= 20) {
        if (homeTeam.score >= 21 && homeTeam.score >= guestTeam.score + 2) {
          return homeTeam;
        }
        if (guestTeam.score >= 21 && guestTeam.score >= homeTeam.score + 2) {
          return guestTeam;
        }
        
        if (homeTeam.score === 30) {
          return homeTeam;
        }
        if (guestTeam.score === 30) {
          return guestTeam;
        }
      }
    } else {
      if (homeTeam.score >= winningScore) {
        return homeTeam;
      }
      if (guestTeam.score >= winningScore) {
        return guestTeam;
      }
    }
    
    return undefined;
  };

  const incrementScore = (teamId: string) => {
    setMatch(prev => {
      const isHomeTeam = prev.homeTeam.id === teamId;
      const updatedHomeTeamScore = isHomeTeam ? prev.homeTeam.score + 1 : prev.homeTeam.score;
      const updatedGuestTeamScore = !isHomeTeam ? prev.guestTeam.score + 1 : prev.guestTeam.score;
      
      const updatedMatch = {
        ...prev,
        homeTeam: {
          ...prev.homeTeam,
          score: updatedHomeTeamScore
        },
        guestTeam: {
          ...prev.guestTeam,
          score: updatedGuestTeamScore
        }
      };
      
      const winner = checkWinner(updatedMatch);
      
      if (winner) {
        const finalMatch = {
          ...updatedMatch,
          winner,
          completed: true
        };
        
        try {
          saveGameHistory(finalMatch);
        } catch (error) {
          console.error("Error saving match history:", error);
        }
        
        toast({
          title: "Match Complete!",
          description: `${winner.name} has won the match!`,
        });
        
        return finalMatch;
      }
      
      try {
        updateServeReceive(isHomeTeam);
      } catch (error) {
        console.error("Error updating serve/receive:", error);
      }
      
      return updatedMatch;
    });
  };

  const decrementScore = (teamId: string) => {
    setMatch(prev => {
      const isHomeTeam = prev.homeTeam.id === teamId;
      const currentScore = isHomeTeam ? prev.homeTeam.score : prev.guestTeam.score;
      
      if (currentScore <= 0) {
        return prev;
      }
      
      const updatedMatch = {
        ...prev,
        homeTeam: {
          ...prev.homeTeam,
          score: isHomeTeam && prev.homeTeam.score > 0 
            ? prev.homeTeam.score - 1 
            : prev.homeTeam.score
        },
        guestTeam: {
          ...prev.guestTeam,
          score: !isHomeTeam && prev.guestTeam.score > 0 
            ? prev.guestTeam.score - 1 
            : prev.guestTeam.score
        },
        completed: false,
        winner: undefined
      };
      
      try {
        updateServeReceive(!isHomeTeam);
      } catch (error) {
        console.error("Error updating serve/receive:", error);
      }
      
      return updatedMatch;
    });
  };

  const completeMatch = () => {
    const winner = match.homeTeam.score > match.guestTeam.score 
      ? match.homeTeam 
      : match.guestTeam;
    
    try {
      saveGameHistory({
        ...match,
        winner,
        completed: true
      });
    } catch (error) {
      console.error("Error saving match result:", error);
    }
    
    setMatch(prev => ({
      ...prev,
      winner,
      completed: true
    }));
    
    toast({
      title: "Match Manually Completed",
      description: `${winner.name} has been recorded as the winner.`,
    });
  };

  const setWinningScore = (score: number) => {
    setMatch(prev => ({
      ...prev,
      winningScore: score
    }));
    
    toast({
      title: "Winning Score Updated",
      description: `The winning score is now set to ${score} points.`,
    });
  };

  return (
    <BadmintonContext.Provider
      value={{
        match,
        createMatch,
        resetMatch,
        updateTeamName,
        updatePlayerName,
        incrementScore,
        decrementScore,
        completeMatch,
        setWinningScore,
        toggleMatchType,
        isSingles
      }}
    >
      {children}
    </BadmintonContext.Provider>
  );
};

export const useBadminton = () => {
  const context = useContext(BadmintonContext);
  if (context === undefined) {
    throw new Error('useBadminton must be used within a BadmintonProvider');
  }
  return context;
};
