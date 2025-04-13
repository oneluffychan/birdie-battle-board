
import { GameHistory, PlayerStats } from "@/types/badminton";

// Keys for localStorage
const GAME_HISTORY_KEY = "badminton_game_history";
const PLAYER_STATS_KEY = "badminton_player_stats";

// Game History
export const saveGameHistory = (game: GameHistory): void => {
  try {
    const existingGames = getGameHistory();
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify([...existingGames, game]));
  } catch (error) {
    console.error("Error saving game history:", error);
  }
};

export const getGameHistory = (): GameHistory[] => {
  try {
    const games = localStorage.getItem(GAME_HISTORY_KEY);
    return games ? JSON.parse(games) : [];
  } catch (error) {
    console.error("Error getting game history:", error);
    return [];
  }
};

// Player Stats
export const updatePlayerStats = (playerNames: string[], winner: boolean): void => {
  try {
    const existingStats = getPlayerStats();
    
    const updatedStats = playerNames.map(name => {
      const existingPlayer = existingStats.find(p => p.name === name);
      
      if (existingPlayer) {
        const gamesPlayed = existingPlayer.gamesPlayed + 1;
        const gamesWon = existingPlayer.gamesWon + (winner ? 1 : 0);
        
        return {
          ...existingPlayer,
          gamesPlayed,
          gamesWon,
          winPercentage: Math.round((gamesWon / gamesPlayed) * 100)
        };
      } else {
        return {
          id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          gamesPlayed: 1,
          gamesWon: winner ? 1 : 0,
          winPercentage: winner ? 100 : 0
        };
      }
    });
    
    // Merge existing players that weren't in this game with updated players
    const mergedStats = [
      ...existingStats.filter(p => !playerNames.includes(p.name)),
      ...updatedStats
    ];
    
    localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(mergedStats));
  } catch (error) {
    console.error("Error updating player stats:", error);
  }
};

export const getPlayerStats = (): PlayerStats[] => {
  try {
    const stats = localStorage.getItem(PLAYER_STATS_KEY);
    return stats ? JSON.parse(stats) : [];
  } catch (error) {
    console.error("Error getting player stats:", error);
    return [];
  }
};

// Get top players sorted by win percentage
export const getTopPlayers = (limit = 5): PlayerStats[] => {
  const allPlayers = getPlayerStats();
  
  // Only include players with at least 3 games
  const qualifiedPlayers = allPlayers.filter(p => p.gamesPlayed >= 3);
  
  return qualifiedPlayers
    .sort((a, b) => b.winPercentage - a.winPercentage)
    .slice(0, limit);
};
