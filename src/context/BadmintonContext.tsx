import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Match, Team, Player } from '@/types/badminton';
import { saveGameHistory, updateAllPlayerStats } from '@/utils/supabaseDB';
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

  const updateServeReceive = (homeTeamScore: number, guestTeamScore: number, isHomeTeamScored: boolean) => {
    console.log("Updating serve and receive", { homeTeamScore, guestTeamScore, isHomeTeamScored });
    
    const totalScore = homeTeamScore + guestTeamScore;
    const isEvenScore = totalScore % 2 === 0;
    
    if (isSingles) {
      // In singles - the server alternates sides when the server's score is even/odd
      // If you score, you serve; if you lose, opponent serves
      const isHomeTeamServing = isHomeTeamScored;
      
      setMatch(prev => ({
        ...prev,
        homeTeam: {
          ...prev.homeTeam,
          players: prev.homeTeam.players.map(p => ({
            ...p,
            isServing: isHomeTeamServing,
            isReceiving: !isHomeTeamServing,
          })).slice(0, 1),
        },
        guestTeam: {
          ...prev.guestTeam,
          players: prev.guestTeam.players.map(p => ({
            ...p,
            isServing: !isHomeTeamServing,
            isReceiving: isHomeTeamServing,
          })).slice(0, 1),
        }
      }));
    } else {
      // For doubles
      // The serving team alternates players after each serving turn
      // The serving team changes when the receiving team scores
      // Server alternates between courts on every point
      
      // Determine which team is serving
      const isHomeTeamServing = isHomeTeamScored;
      
      setMatch(prev => {
        const updatedHomeTeamPlayers = prev.homeTeam.players.map((p, idx) => {
          // In doubles, player position alternates based on whether score is even/odd
          const shouldServe = isHomeTeamServing && (
            isEvenScore ? idx === 0 : idx === 1
          );
          
          const shouldReceive = !isHomeTeamServing && (
            isEvenScore ? idx === 0 : idx === 1
          );
          
          return {
            ...p,
            isServing: shouldServe,
            isReceiving: shouldReceive
          };
        });
        
        const updatedGuestTeamPlayers = prev.guestTeam.players.map((p, idx) => {
          const shouldServe = !isHomeTeamServing && (
            isEvenScore ? idx === 0 : idx === 1
          );
          
          const shouldReceive = isHomeTeamServing && (
            isEvenScore ? idx === 0 : idx === 1
          );
          
          return {
            ...p,
            isServing: shouldServe,
            isReceiving: shouldReceive
          };
        });
        
        console.log(`Total score: ${totalScore}, Even score: ${isEvenScore}`);
        console.log(`Home team serving: ${isHomeTeamServing}`);
        
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: updatedHomeTeamPlayers
          },
          guestTeam: {
            ...prev.guestTeam,
            players: updatedGuestTeamPlayers
          }
        };
      });
    }
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

    // Update serving and receiving when match type changes
    const homeTeamScore = match.homeTeam.score;
    const guestTeamScore = match.guestTeam.score;
    updateServeReceive(homeTeamScore, guestTeamScore, true);
  };

  const checkWinner = (matchToCheck: Match): Team | undefined => {
    const { homeTeam, guestTeam, winningScore } = matchToCheck;
    
    if (homeTeam.score >= winningScore) {
      return homeTeam;
    }
    if (guestTeam.score >= winningScore) {
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
          updateAllPlayerStats();
        } catch (error) {
          console.error("Error saving match history:", error);
        }
        
        toast({
          title: "Match Complete!",
          description: `${winner.name} has won the match!`,
        });
        
        return finalMatch;
      }
      
      // First return the updated match
      return updatedMatch;
    });
    
    // Then in a separate operation update the serving/receiving status using the LATEST state
    setTimeout(() => {
      setMatch(latest => {
        // Update who is serving and receiving with the latest scores
        updateServeReceive(
          latest.homeTeam.score, 
          latest.guestTeam.score, 
          latest.homeTeam.id === teamId
        );
        return latest;
      });
    }, 0);
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
      
      return updatedMatch;
    });
    
    // Update serve/receive in a separate call to ensure we're using the latest state
    setTimeout(() => {
      setMatch(latest => {
        // For decrement, the team that DIDN'T lose the point would be serving
        // So we pass the opposite of isHomeTeam
        updateServeReceive(
          latest.homeTeam.score, 
          latest.guestTeam.score, 
          latest.homeTeam.id !== teamId
        );
        return latest;
      });
    }, 0);
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

  // Initialize serving and receiving players when the component mounts
  useEffect(() => {
    updateServeReceive(
      match.homeTeam.score, 
      match.guestTeam.score, 
      true
    );
  }, []);

  // Update serving and receiving players when match type changes
  useEffect(() => {
    updateServeReceive(
      match.homeTeam.score, 
      match.guestTeam.score, 
      true
    );
  }, [isSingles]);

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
