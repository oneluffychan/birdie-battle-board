import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Match, Team, Player } from "@/types/badminton";
import { saveGameHistory, updateAllPlayerStats } from "@/utils/supabaseDB";
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
    name: isHomeTeam ? "Player 1" : "Player 3",
    isServing: isHomeTeam,
    isReceiving: !isHomeTeam,
    position: "right", // Default position for first player (even score at start)
  },
  {
    id: uuidv4(),
    name: isHomeTeam ? "Player 2" : "Player 4",
    position: "left", // Default position for second player
  },
];

const createDefaultMatch = (): Match => ({
  id: uuidv4(),
  date: new Date().toISOString(),
  homeTeam: {
    id: uuidv4(),
    name: "Home Team",
    players: defaultPlayers(true),
    score: 0,
    color: "bg-gradient-home",
    isHomeTeam: true,
  },
  guestTeam: {
    id: uuidv4(),
    name: "Guest Team",
    players: defaultPlayers(false),
    score: 0,
    color: "bg-gradient-guest",
    isHomeTeam: false,
  },
  winningScore: 21,
  completed: false,
});

const BadmintonContext = createContext<BadmintonContextType | undefined>(
  undefined
);

export const BadmintonProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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
          isReceiving: idx === 0 && !match.homeTeam.isHomeTeam,
          position: idx === 0 ? "right" : "left", // Reset positions
        })),
      },
      guestTeam: {
        ...match.guestTeam,
        score: 0,
        players: match.guestTeam.players.map((player, idx) => ({
          ...player,
          isServing: idx === 0 && match.guestTeam.isHomeTeam,
          isReceiving: idx === 0 && !match.guestTeam.isHomeTeam,
          position: idx === 0 ? "right" : "left", // Reset positions
        })),
      },
      winningScore: match.winningScore,
    });

    toast({
      title: "Match Reset",
      description: "The match has been reset. Scores are back to 0.",
    });
  };

  const updateTeamName = (teamId: string, name: string) => {
    setMatch((prev) => {
      if (prev.homeTeam.id === teamId) {
        return { ...prev, homeTeam: { ...prev.homeTeam, name } };
      } else if (prev.guestTeam.id === teamId) {
        return { ...prev, guestTeam: { ...prev.guestTeam, name } };
      }
      return prev;
    });
  };

  const updatePlayerName = (teamId: string, playerId: string, name: string) => {
    setMatch((prev) => {
      if (prev.homeTeam.id === teamId) {
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: prev.homeTeam.players.map((p) =>
              p.id === playerId ? { ...p, name } : p
            ),
          },
        };
      } else if (prev.guestTeam.id === teamId) {
        return {
          ...prev,
          guestTeam: {
            ...prev.guestTeam,
            players: prev.guestTeam.players.map((p) =>
              p.id === playerId ? { ...p, name } : p
            ),
          },
        };
      }
      return prev;
    });
  };

  // This is the fixed updateServeReceive function that maintains the same server
  // when the serving team scores

  const updateServeReceive = (
    scoringTeamId: string,
    isPointScored: boolean
  ) => {
    setMatch((prev) => {
      // Determine current serving team
      const isHomeTeamServing = prev.homeTeam.players.some((p) => p.isServing);

      // Check if the serving team scored
      const isServingTeamScoring =
        (isHomeTeamServing && prev.homeTeam.id === scoringTeamId) ||
        (!isHomeTeamServing && prev.guestTeam.id === scoringTeamId);

      // Calculate total score to determine service court (even/odd)
      const totalScore = prev.homeTeam.score + prev.guestTeam.score;

      // New total score including the point that was just scored (if applicable)
      const newTotalScore = isPointScored ? totalScore + 1 : totalScore;
      const isNewScoreEven = newTotalScore % 2 === 0;

      // Determine new serving team
      const newHomeTeamServing = isPointScored
        ? isServingTeamScoring
          ? isHomeTeamServing // Same team keeps serving if they scored
          : !isHomeTeamServing // Switch teams if receiving team scored
        : isHomeTeamServing; // No change if not a point scored (e.g., reset)

      if (isSingles) {
        // For singles, we only have one player per team
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: prev.homeTeam.players
              .map((p) => ({
                ...p,
                isServing: newHomeTeamServing,
                isReceiving: !newHomeTeamServing,
                // In singles, position is based strictly on score parity
                position: isNewScoreEven ? "right" : "left",
              }))
              .slice(0, 1),
          },
          guestTeam: {
            ...prev.guestTeam,
            players: prev.guestTeam.players
              .map((p) => ({
                ...p,
                isServing: !newHomeTeamServing,
                isReceiving: newHomeTeamServing,
                // Position is also based on score parity
                position: isNewScoreEven ? "right" : "left",
              }))
              .slice(0, 1),
          },
        };
      } else {
        // For doubles
        // Get references to current home and guest team players
        const homeTeamPlayers = [...prev.homeTeam.players];
        const guestTeamPlayers = [...prev.guestTeam.players];

        // Find the currently serving player (if any)
        const homeServingPlayerIdx = homeTeamPlayers.findIndex(
          (p) => p.isServing
        );
        const guestServingPlayerIdx = guestTeamPlayers.findIndex(
          (p) => p.isServing
        );

        // Find players by position
        let homeRightPlayer = homeTeamPlayers.findIndex(
          (p) => p.position === "right"
        );
        let homeLeftPlayer = homeTeamPlayers.findIndex(
          (p) => p.position === "left"
        );
        let guestRightPlayer = guestTeamPlayers.findIndex(
          (p) => p.position === "right"
        );
        let guestLeftPlayer = guestTeamPlayers.findIndex(
          (p) => p.position === "left"
        );

        // If positions aren't set properly, initialize them
        if (homeRightPlayer === -1 || homeLeftPlayer === -1) {
          homeRightPlayer = 0;
          homeLeftPlayer = 1;
          homeTeamPlayers[0].position = "right";
          homeTeamPlayers[1].position = "left";
        }

        if (guestRightPlayer === -1 || guestLeftPlayer === -1) {
          guestRightPlayer = 0;
          guestLeftPlayer = 1;
          guestTeamPlayers[0].position = "right";
          guestTeamPlayers[1].position = "left";
        }

        // Handle player movement when same team scores again
        if (isPointScored && isServingTeamScoring) {
          // When same team scores, the SAME PLAYER continues to serve
          // but players switch courts based on score
          if (isHomeTeamServing && homeServingPlayerIdx !== -1) {
            const servingPlayer = homeTeamPlayers[homeServingPlayerIdx];

            // Move serving player to correct court based on score
            if (isNewScoreEven) {
              // On even score, serving player should be in right court
              if (servingPlayer.position !== "right") {
                // Switch positions of home team players
                homeTeamPlayers.forEach((p) => {
                  p.position = p.position === "right" ? "left" : "right";
                });
              }
            } else {
              // On odd score, serving player should be in left court
              if (servingPlayer.position !== "left") {
                // Switch positions of home team players
                homeTeamPlayers.forEach((p) => {
                  p.position = p.position === "right" ? "left" : "right";
                });
              }
            }

            // Update right and left player indices after possible position switch
            homeRightPlayer = homeTeamPlayers.findIndex(
              (p) => p.position === "right"
            );
            homeLeftPlayer = homeTeamPlayers.findIndex(
              (p) => p.position === "left"
            );

            // Set receiving player on opposite team (diagonal to server)
            if (isNewScoreEven) {
              // Server in right court serves to left court
              guestTeamPlayers[guestRightPlayer].isReceiving = false;
              guestTeamPlayers[guestLeftPlayer].isReceiving = true;
            } else {
              // Server in left court serves to right court
              guestTeamPlayers[guestRightPlayer].isReceiving = true;
              guestTeamPlayers[guestLeftPlayer].isReceiving = false;
            }
          } else if (!isHomeTeamServing && guestServingPlayerIdx !== -1) {
            const servingPlayer = guestTeamPlayers[guestServingPlayerIdx];

            // Move serving player to correct court based on score
            if (isNewScoreEven) {
              // On even score, serving player should be in right court
              if (servingPlayer.position !== "right") {
                // Switch positions of guest team players
                guestTeamPlayers.forEach((p) => {
                  p.position = p.position === "right" ? "left" : "right";
                });
              }
            } else {
              // On odd score, serving player should be in left court
              if (servingPlayer.position !== "left") {
                // Switch positions of guest team players
                guestTeamPlayers.forEach((p) => {
                  p.position = p.position === "right" ? "left" : "right";
                });
              }
            }

            // Update right and left player indices after possible position switch
            guestRightPlayer = guestTeamPlayers.findIndex(
              (p) => p.position === "right"
            );
            guestLeftPlayer = guestTeamPlayers.findIndex(
              (p) => p.position === "left"
            );

            // Set receiving player on opposite team (diagonal to server)
            if (isNewScoreEven) {
              // Server in right court serves to left court
              homeTeamPlayers[homeRightPlayer].isReceiving = false;
              homeTeamPlayers[homeLeftPlayer].isReceiving = true;
            } else {
              // Server in left court serves to right court
              homeTeamPlayers[homeRightPlayer].isReceiving = true;
              homeTeamPlayers[homeLeftPlayer].isReceiving = false;
            }
          }
        }
        // Handle service change when receiving team scores
        else if (isPointScored && !isServingTeamScoring) {
          // Reset all serving and receiving status
          homeTeamPlayers.forEach((p) => {
            p.isServing = false;
            p.isReceiving = false;
          });

          guestTeamPlayers.forEach((p) => {
            p.isServing = false;
            p.isReceiving = false;
          });

          // When service changes teams, the correct player based on score serves
          if (newHomeTeamServing) {
            if (isNewScoreEven) {
              // Right court player serves on even score
              homeTeamPlayers[homeRightPlayer].isServing = true;
              guestTeamPlayers[guestLeftPlayer].isReceiving = true;
            } else {
              // Left court player serves on odd score
              homeTeamPlayers[homeLeftPlayer].isServing = true;
              guestTeamPlayers[guestRightPlayer].isReceiving = true;
            }
          } else {
            // Guest team is serving
            if (isNewScoreEven) {
              // Right court player serves on even score
              guestTeamPlayers[guestRightPlayer].isServing = true;
              homeTeamPlayers[homeLeftPlayer].isReceiving = true;
            } else {
              // Left court player serves on odd score
              guestTeamPlayers[guestLeftPlayer].isServing = true;
              homeTeamPlayers[homeRightPlayer].isReceiving = true;
            }
          }
        }
        // For reset or initialization without scoring
        else {
          // Reset all serving and receiving status
          homeTeamPlayers.forEach((p) => {
            p.isServing = false;
            p.isReceiving = false;
          });

          guestTeamPlayers.forEach((p) => {
            p.isServing = false;
            p.isReceiving = false;
          });

          // Initialize serving: home team's right court player serves first
          if (newHomeTeamServing) {
            homeTeamPlayers[homeRightPlayer].isServing = true;
            guestTeamPlayers[guestLeftPlayer].isReceiving = true;
          } else {
            guestTeamPlayers[guestRightPlayer].isServing = true;
            homeTeamPlayers[homeLeftPlayer].isReceiving = true;
          }
        }

        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: homeTeamPlayers,
          },
          guestTeam: {
            ...prev.guestTeam,
            players: guestTeamPlayers,
          },
        };
      }
    });
  };

  const toggleMatchType = () => {
    setIsSingles((prev) => !prev);

    setMatch((prev) => {
      const newMatchType = !isSingles;

      if (newMatchType) {
        // Switching to singles
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: prev.homeTeam.players.slice(0, 1).map((p) => ({
              ...p,
              position: prev.homeTeam.score % 2 === 0 ? "right" : "left",
            })),
          },
          guestTeam: {
            ...prev.guestTeam,
            players: prev.guestTeam.players.slice(0, 1).map((p) => ({
              ...p,
              position: prev.guestTeam.score % 2 === 0 ? "right" : "left",
            })),
          },
        };
      } else {
        // Switching to doubles
        const homePlayerCount = prev.homeTeam.players.length;
        const guestPlayerCount = prev.guestTeam.players.length;

        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players:
              homePlayerCount < 2
                ? [
                    {
                      ...prev.homeTeam.players[0],
                      position: "right",
                    },
                    {
                      id: uuidv4(),
                      name: "Player 2",
                      position: "left",
                      isServing: false,
                      isReceiving: false,
                    },
                  ]
                : prev.homeTeam.players.map((p, idx) => ({
                    ...p,
                    position: idx === 0 ? "right" : "left",
                  })),
          },
          guestTeam: {
            ...prev.guestTeam,
            players:
              guestPlayerCount < 2
                ? [
                    {
                      ...prev.guestTeam.players[0],
                      position: "right",
                    },
                    {
                      id: uuidv4(),
                      name: "Player 4",
                      position: "left",
                      isServing: false,
                      isReceiving: false,
                    },
                  ]
                : prev.guestTeam.players.map((p, idx) => ({
                    ...p,
                    position: idx === 0 ? "right" : "left",
                  })),
          },
        };
      }
    });

    toast({
      title: !isSingles ? "Singles Mode" : "Doubles Mode",
      description: !isSingles
        ? "Switched to singles match mode."
        : "Switched to doubles match mode.",
    });

    setTimeout(() => {
      updateServeReceive(match.homeTeam.id, false);
    }, 0);
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
    setMatch((prev) => {
      const isHomeTeam = prev.homeTeam.id === teamId;

      const updatedHomeTeamScore = isHomeTeam
        ? prev.homeTeam.score + 1
        : prev.homeTeam.score;
      const updatedGuestTeamScore = !isHomeTeam
        ? prev.guestTeam.score + 1
        : prev.guestTeam.score;

      const updatedMatch = {
        ...prev,
        homeTeam: {
          ...prev.homeTeam,
          score: updatedHomeTeamScore,
        },
        guestTeam: {
          ...prev.guestTeam,
          score: updatedGuestTeamScore,
        },
      };

      const winner = checkWinner(updatedMatch);

      if (winner) {
        const finalMatch = {
          ...updatedMatch,
          winner,
          completed: true,
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

      return updatedMatch;
    });

    setTimeout(() => {
      updateServeReceive(teamId, true);
    }, 0);
  };

  const decrementScore = (teamId: string) => {
    setMatch((prev) => {
      const isHomeTeam = prev.homeTeam.id === teamId;
      const currentScore = isHomeTeam
        ? prev.homeTeam.score
        : prev.guestTeam.score;

      if (currentScore <= 0) {
        return prev;
      }

      const updatedMatch = {
        ...prev,
        homeTeam: {
          ...prev.homeTeam,
          score:
            isHomeTeam && prev.homeTeam.score > 0
              ? prev.homeTeam.score - 1
              : prev.homeTeam.score,
        },
        guestTeam: {
          ...prev.guestTeam,
          score:
            !isHomeTeam && prev.guestTeam.score > 0
              ? prev.guestTeam.score - 1
              : prev.guestTeam.score,
        },
        completed: false,
        winner: undefined,
      };

      return updatedMatch;
    });

    setTimeout(() => {
      const oppositeTeamId =
        match.homeTeam.id === teamId ? match.guestTeam.id : match.homeTeam.id;
      updateServeReceive(oppositeTeamId, false);
    }, 0);
  };

  const completeMatch = () => {
    const winner =
      match.homeTeam.score > match.guestTeam.score
        ? match.homeTeam
        : match.guestTeam;

    try {
      saveGameHistory({
        ...match,
        winner,
        completed: true,
      });
    } catch (error) {
      console.error("Error saving match result:", error);
    }

    setMatch((prev) => ({
      ...prev,
      winner,
      completed: true,
    }));

    toast({
      title: "Match Manually Completed",
      description: `${winner.name} has been recorded as the winner.`,
    });
  };

  const setWinningScore = (score: number) => {
    setMatch((prev) => ({
      ...prev,
      winningScore: score,
    }));

    toast({
      title: "Winning Score Updated",
      description: `The winning score is now set to ${score} points.`,
    });
  };

  useEffect(() => {
    setTimeout(() => {
      updateServeReceive(match.homeTeam.id, false);
    }, 0);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      updateServeReceive(match.homeTeam.id, false);
    }, 0);
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
        isSingles,
      }}
    >
      {children}
    </BadmintonContext.Provider>
  );
};

export const useBadminton = () => {
  const context = useContext(BadmintonContext);
  if (context === undefined) {
    throw new Error("useBadminton must be used within a BadmintonProvider");
  }
  return context;
};
