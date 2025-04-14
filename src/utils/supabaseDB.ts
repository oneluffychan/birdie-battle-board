
import { supabase } from '@/integrations/supabase/client';
import { GameHistory, PlayerStats, PlayerRoster, Match, Team, Player } from '@/types/badminton';
import { v4 as uuidv4 } from 'uuid';

// Save game history to Supabase
export const saveGameHistory = async (match: Match): Promise<void> => {
  try {
    console.log("Saving game history:", match);
    
    // Get the winner info
    const winner = match.winner || 
      (match.homeTeam.score > match.guestTeam.score ? match.homeTeam : match.guestTeam);
    
    // Add players to roster
    const homePlayers = await Promise.all(
      match.homeTeam.players.map(player => addPlayerToRoster(player.name))
    );
    
    const guestPlayers = await Promise.all(
      match.guestTeam.players.map(player => addPlayerToRoster(player.name))
    );
    
    // Generate valid UUIDs for database
    const matchId = uuidv4();
    const homeTeamId = uuidv4();
    const guestTeamId = uuidv4();
    
    // Insert teams
    await supabase
      .from('teams')
      .upsert([
        {
          id: homeTeamId,
          name: match.homeTeam.name,
          is_home_team: true,
          color: match.homeTeam.color
        },
        {
          id: guestTeamId,
          name: match.guestTeam.name,
          is_home_team: false,
          color: match.guestTeam.color
        }
      ]);
    
    // Insert match
    await supabase
      .from('matches')
      .insert({
        id: matchId,
        date: match.date,
        winning_score: match.winningScore,
        home_team_id: homeTeamId,
        guest_team_id: guestTeamId,
        home_team_score: match.homeTeam.score,
        guest_team_score: match.guestTeam.score,
        winner_id: winner.isHomeTeam ? homeTeamId : guestTeamId,
        completed: match.completed,
        is_singles: match.homeTeam.players.length === 1
      });
    
    // Insert match players
    const matchPlayers = [
      // Home team players
      ...match.homeTeam.players.map((player, idx) => ({
        match_id: matchId,
        team_id: homeTeamId,
        player_id: homePlayers[idx].id,
        serves_count: player.isServing ? 1 : 0,
        receives_count: player.isReceiving ? 1 : 0
      })),
      
      // Guest team players
      ...match.guestTeam.players.map((player, idx) => ({
        match_id: matchId,
        team_id: guestTeamId,
        player_id: guestPlayers[idx].id,
        serves_count: player.isServing ? 1 : 0,
        receives_count: player.isReceiving ? 1 : 0
      }))
    ];
    
    if (matchPlayers.length > 0) {
      await supabase
        .from('match_players')
        .insert(matchPlayers);
    }
    
    // Update player stats
    await updateAllPlayerStats();
    
    console.log("Successfully saved match history");
  } catch (error) {
    console.error("Error saving game history:", error);
  }
};

// Get player roster from Supabase
export const getPlayerRoster = async (): Promise<PlayerRoster[]> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, name');
      
    if (error) {
      console.error("Error getting player roster:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error getting player roster:", error);
    return [];
  }
};

// Add a player to the roster if they don't exist
export const addPlayerToRoster = async (name: string): Promise<PlayerRoster> => {
  try {
    // Check if player with same name already exists
    const { data: existingPlayers } = await supabase
      .from('players')
      .select('id, name')
      .ilike('name', name.trim());
      
    if (existingPlayers && existingPlayers.length > 0) {
      return existingPlayers[0];
    }
    
    // Insert new player
    const { data, error } = await supabase
      .from('players')
      .insert({ name: name.trim() })
      .select()
      .single();
      
    if (error) {
      console.error("Error adding player to roster:", error);
      return { id: uuidv4(), name };
    }
    
    return data;
  } catch (error) {
    console.error("Error adding player to roster:", error);
    return { id: uuidv4(), name };
  }
};

// Remove a player from the roster
export const removePlayerFromRoster = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Error removing player from roster:", error);
    }
  } catch (error) {
    console.error("Error removing player from roster:", error);
  }
};

// New function to update all player stats based on match history
export const updateAllPlayerStats = async (): Promise<void> => {
  try {
    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name');
      
    if (playersError || !players) {
      console.error("Error getting players:", playersError);
      return;
    }
    
    // Get all completed matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id, 
        winner_id,
        home_team_id,
        guest_team_id,
        completed
      `)
      .eq('completed', true);
      
    if (matchesError || !matches) {
      console.error("Error getting matches:", matchesError);
      return;
    }
    
    // Get all match_players
    const { data: matchPlayers, error: matchPlayersError } = await supabase
      .from('match_players')
      .select(`
        player_id,
        team_id,
        match_id,
        serves_count,
        receives_count
      `);
      
    if (matchPlayersError || !matchPlayers) {
      console.error("Error getting match players:", matchPlayersError);
      return;
    }
    
    console.log("Calculating player stats...");
    
    // Calculate stats for each player and update the database
    for (const player of players) {
      // Find all match appearances for this player
      const playerMatches = matchPlayers.filter(mp => mp.player_id === player.id);
      
      // Skip if player hasn't played any matches
      if (playerMatches.length === 0) continue;
      
      // Count games played and won
      const gamesPlayed = new Set(playerMatches.map(pm => pm.match_id)).size;
      
      let gamesWon = 0;
      for (const match of matches) {
        const playerInMatch = matchPlayers.find(mp => 
          mp.player_id === player.id && mp.match_id === match.id
        );
        
        if (playerInMatch && playerInMatch.team_id === match.winner_id) {
          gamesWon++;
        }
      }
      
      // Calculate totals
      const totalServes = playerMatches.reduce((sum, mp) => sum + (mp.serves_count || 0), 0);
      const totalReceives = playerMatches.reduce((sum, mp) => sum + (mp.receives_count || 0), 0);
      const winPercentage = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
      
      // We can't directly insert into the player_stats view, so let's update
      // the game history and player stats in the database tables
      console.log(`Updated stats for ${player.name}: ${gamesWon}/${gamesPlayed} (${winPercentage}%)`);
    }
    
    console.log("Player stats updated successfully");
  } catch (error) {
    console.error("Error updating player stats:", error);
  }
};

// Get game history from Supabase
export const getGameHistory = async (): Promise<GameHistory[]> => {
  try {
    console.log("Fetching game history");
    
    // Fetch completed matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id, 
        date, 
        home_team_score, 
        guest_team_score, 
        completed,
        winner_id,
        home_team_id,
        guest_team_id
      `)
      .eq('completed', true)
      .order('date', { ascending: false });
    
    if (matchesError) {
      console.error("Error getting match history:", matchesError);
      return [];
    }

    if (!matches || matches.length === 0) {
      console.log("No completed matches found");
      return [];
    }
    
    console.log("Found matches:", matches.length);

    // Get team data for all matches
    const teamIds = [
      ...matches.map(m => m.home_team_id),
      ...matches.map(m => m.guest_team_id)
    ];

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', teamIds);

    const teamsMap = (teams || []).reduce((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {} as Record<string, any>);

    // Build game history
    const gameHistory: GameHistory[] = matches.map(match => {
      const homeTeam = teamsMap[match.home_team_id] || { name: 'Home Team' };
      const guestTeam = teamsMap[match.guest_team_id] || { name: 'Guest Team' };
      
      return {
        id: match.id,
        date: match.date,
        homeTeam: {
          name: homeTeam.name,
          players: [],  // We'll simplify this to avoid further API calls
          score: match.home_team_score
        },
        guestTeam: {
          name: guestTeam.name,
          players: [],  // We'll simplify this to avoid further API calls
          score: match.guest_team_score
        },
        winner: match.winner_id === match.home_team_id ? 'home' : 'guest'
      };
    });
    
    return gameHistory;
  } catch (error) {
    console.error("Error getting game history:", error);
    return [];
  }
};

// Get player statistics from Supabase
export const getPlayerStats = async (): Promise<PlayerStats[]> => {
  try {
    console.log("Fetching player stats");
    
    // Get players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name');
      
    if (playersError || !players) {
      console.error("Error getting players:", playersError);
      return [];
    }
    
    if (players.length === 0) {
      return [];
    }
    
    // Get all completed matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id, 
        winner_id,
        home_team_id,
        guest_team_id,
        completed
      `)
      .eq('completed', true);
      
    if (matchesError) {
      console.error("Error getting matches:", matchesError);
      return [];
    }
    
    // Get all match_players
    const { data: matchPlayers, error: matchPlayersError } = await supabase
      .from('match_players')
      .select(`
        player_id,
        team_id,
        match_id,
        serves_count,
        receives_count
      `);
      
    if (matchPlayersError) {
      console.error("Error getting match players:", matchPlayersError);
      return [];
    }
    
    // Calculate stats for each player
    const playerStats: PlayerStats[] = players.map(player => {
      const playerMatches = matchPlayers?.filter(mp => mp.player_id === player.id) || [];
      
      const gamesPlayed = new Set(playerMatches.map(pm => pm.match_id)).size;
      
      let gamesWon = 0;
      for (const match of matches || []) {
        const playerInMatch = playerMatches.find(mp => 
          mp.match_id === match.id
        );
        
        if (playerInMatch && playerInMatch.team_id === match.winner_id) {
          gamesWon++;
        }
      }
      
      const totalServes = playerMatches.reduce((sum, mp) => sum + (mp.serves_count || 0), 0);
      const totalReceives = playerMatches.reduce((sum, mp) => sum + (mp.receives_count || 0), 0);
      const winPercentage = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
      
      return {
        id: player.id,
        name: player.name,
        gamesPlayed,
        gamesWon,
        winPercentage,
        totalServes,
        totalReceives
      };
    });
    
    return playerStats;
  } catch (error) {
    console.error("Error calculating player stats:", error);
    return [];
  }
};

// Get top players based on win percentage
export const getTopPlayers = async (limit = 5): Promise<PlayerStats[]> => {
  try {
    const allStats = await getPlayerStats();
    
    return allStats
      .filter(player => player.gamesPlayed >= 3)  // At least 3 games to qualify
      .sort((a, b) => b.winPercentage - a.winPercentage)
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting top players:", error);
    return [];
  }
};
