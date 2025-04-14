
import { supabase } from '@/integrations/supabase/client';
import { GameHistory, PlayerStats, PlayerRoster, Match, Team, Player } from '@/types/badminton';
import { nanoid } from 'nanoid';

// Types matching Supabase tables
interface SupabasePlayer {
  id: string;
  name: string;
}

interface SupabaseTeam {
  id: string;
  name: string;
  is_home_team: boolean;
  color: string;
}

interface SupabaseMatch {
  id: string;
  date: string;
  winning_score: number;
  home_team_id: string;
  guest_team_id: string;
  home_team_score: number;
  guest_team_score: number;
  winner_id: string | null;
  completed: boolean;
  is_singles: boolean;
}

interface SupabaseMatchPlayer {
  match_id: string;
  team_id: string;
  player_id: string;
  serves_count: number;
  receives_count: number;
}

// Player Roster
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
      return { id: nanoid(), name };
    }
    
    return data;
  } catch (error) {
    console.error("Error adding player to roster:", error);
    return { id: nanoid(), name };
  }
};

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

// Match History
export const saveGameHistory = async (match: Match): Promise<void> => {
  try {
    console.log("Saving game history:", match);
    
    // Get the winner info
    const winner = match.winner || 
      (match.homeTeam.score > match.guestTeam.score ? match.homeTeam : match.guestTeam);
    
    // Add home team players to roster if they don't exist
    const homePlayers = [];
    for (const player of match.homeTeam.players) {
      try {
        const addedPlayer = await addPlayerToRoster(player.name);
        homePlayers.push(addedPlayer);
      } catch (error) {
        console.error("Error adding home player to roster:", error);
      }
    }
    
    // Add guest team players to roster if they don't exist
    const guestPlayers = [];
    for (const player of match.guestTeam.players) {
      try {
        const addedPlayer = await addPlayerToRoster(player.name);
        guestPlayers.push(addedPlayer);
      } catch (error) {
        console.error("Error adding guest player to roster:", error);
      }
    }
    
    // Check if home and guest teams already exist, create them if they don't
    const homeTeamResponse = await supabase
      .from('teams')
      .upsert({
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        is_home_team: true,
        color: match.homeTeam.color
      })
      .select()
      .single();
      
    const guestTeamResponse = await supabase
      .from('teams')
      .upsert({
        id: match.guestTeam.id,
        name: match.guestTeam.name,
        is_home_team: false,
        color: match.guestTeam.color
      })
      .select()
      .single();
    
    const homeTeamId = homeTeamResponse.data?.id || match.homeTeam.id;
    const guestTeamId = guestTeamResponse.data?.id || match.guestTeam.id;
    const winnerId = winner?.id || null;
    
    // Create match record
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .upsert({
        id: match.id,
        date: match.date,
        winning_score: match.winningScore,
        home_team_id: homeTeamId,
        guest_team_id: guestTeamId,
        home_team_score: match.homeTeam.score,
        guest_team_score: match.guestTeam.score,
        winner_id: winnerId,
        completed: match.completed,
        is_singles: match.homeTeam.players.length === 1
      })
      .select()
      .single();
      
    if (matchError) {
      console.error("Error saving match:", matchError);
      return;
    }
    
    // Create match_players records for all players
    const matchPlayers = [];
    
    // Add home team players
    for (let i = 0; i < match.homeTeam.players.length; i++) {
      const player = match.homeTeam.players[i];
      const playerId = homePlayers[i]?.id || player.id;
      
      matchPlayers.push({
        match_id: match.id,
        team_id: homeTeamId,
        player_id: playerId,
        serves_count: player.isServing ? 1 : 0,
        receives_count: player.isReceiving ? 1 : 0
      });
    }
    
    // Add guest team players
    for (let i = 0; i < match.guestTeam.players.length; i++) {
      const player = match.guestTeam.players[i];
      const playerId = guestPlayers[i]?.id || player.id;
      
      matchPlayers.push({
        match_id: match.id,
        team_id: guestTeamId,
        player_id: playerId,
        serves_count: player.isServing ? 1 : 0,
        receives_count: player.isReceiving ? 1 : 0
      });
    }
    
    // Save match players
    const { error: playersError } = await supabase
      .from('match_players')
      .upsert(matchPlayers);
      
    if (playersError) {
      console.error("Error saving match players:", playersError);
    } else {
      console.log("Successfully saved match history");
    }
  } catch (error) {
    console.error("Error saving game history:", error);
  }
};

export const getGameHistory = async (): Promise<GameHistory[]> => {
  try {
    console.log("Fetching game history");
    
    // Fetch matches with their teams
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

    // Get all team IDs
    const teamIds = [...new Set([
      ...matches.map(m => m.home_team_id),
      ...matches.map(m => m.guest_team_id)
    ])];

    // Fetch all teams at once
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', teamIds);

    if (teamsError) {
      console.error("Error getting teams:", teamsError);
      return [];
    }

    const gameHistory: GameHistory[] = [];
    
    for (const match of matches) {
      try {
        // Get home team players
        const { data: homePlayerMatches, error: homePlayersError } = await supabase
          .from('match_players')
          .select('player_id')
          .eq('match_id', match.id)
          .eq('team_id', match.home_team_id);
        
        if (homePlayersError) {
          console.error("Error getting home players:", homePlayersError);
          continue;
        }

        if (!homePlayerMatches || homePlayerMatches.length === 0) {
          console.log(`No home players found for match ${match.id}`);
          continue;
        }

        // Get player names for home team
        const { data: homePlayers, error: homePlayerNamesError } = await supabase
          .from('players')
          .select('name')
          .in('id', homePlayerMatches.map(pm => pm.player_id));

        if (homePlayerNamesError) {
          console.error("Error getting home player names:", homePlayerNamesError);
          continue;
        }
        
        // Get guest team players
        const { data: guestPlayerMatches, error: guestPlayersError } = await supabase
          .from('match_players')
          .select('player_id')
          .eq('match_id', match.id)
          .eq('team_id', match.guest_team_id);
        
        if (guestPlayersError) {
          console.error("Error getting guest players:", guestPlayersError);
          continue;
        }

        if (!guestPlayerMatches || guestPlayerMatches.length === 0) {
          console.log(`No guest players found for match ${match.id}`);
          continue;
        }

        // Get player names for guest team
        const { data: guestPlayers, error: guestPlayerNamesError } = await supabase
          .from('players')
          .select('name')
          .in('id', guestPlayerMatches.map(pm => pm.player_id));

        if (guestPlayerNamesError) {
          console.error("Error getting guest player names:", guestPlayerNamesError);
          continue;
        }
        
        const homeTeam = teamsData.find(team => team.id === match.home_team_id);
        const guestTeam = teamsData.find(team => team.id === match.guest_team_id);
        
        if (!homeTeam || !guestTeam) {
          console.log(`Could not find teams for match ${match.id}`);
          continue;
        }
        
        gameHistory.push({
          id: match.id,
          date: match.date,
          homeTeam: {
            name: homeTeam?.name || 'Home Team',
            players: homePlayers?.map(p => p.name) || [],
            score: match.home_team_score
          },
          guestTeam: {
            name: guestTeam?.name || 'Guest Team',
            players: guestPlayers?.map(p => p.name) || [],
            score: match.guest_team_score
          },
          winner: match.winner_id === match.home_team_id ? 'home' : 'guest'
        });
      } catch (error) {
        console.error(`Error processing match ${match.id}:`, error);
      }
    }
    
    return gameHistory;
  } catch (error) {
    console.error("Error getting game history:", error);
    return [];
  }
};

// Player Stats
export const updatePlayerStats = async (
  match: Match, 
  teamId: string, 
  isServing: boolean, 
  isReceiving: boolean
): Promise<void> => {
  try {
    const players = match.homeTeam.id === teamId 
      ? match.homeTeam.players 
      : match.guestTeam.players;
      
    for (const player of players) {
      // Get the current match_player record
      const { data: matchPlayer, error: fetchError } = await supabase
        .from('match_players')
        .select('serves_count, receives_count')
        .eq('match_id', match.id)
        .eq('player_id', player.id)
        .single();
        
      if (fetchError) {
        console.error("Error fetching match player stats:", fetchError);
        continue;
      }
      
      // Update serves and receives counts
      const newServesCount = isServing ? (matchPlayer?.serves_count || 0) + 1 : matchPlayer?.serves_count || 0;
      const newReceivesCount = isReceiving ? (matchPlayer?.receives_count || 0) + 1 : matchPlayer?.receives_count || 0;
      
      const { error: updateError } = await supabase
        .from('match_players')
        .update({
          serves_count: newServesCount,
          receives_count: newReceivesCount
        })
        .eq('match_id', match.id)
        .eq('player_id', player.id);
        
      if (updateError) {
        console.error("Error updating player stats:", updateError);
      }
    }
  } catch (error) {
    console.error("Error updating player stats:", error);
  }
};

export const getPlayerStats = async (): Promise<PlayerStats[]> => {
  try {
    console.log("Fetching player stats");
    
    // First get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name');
      
    if (playersError) {
      console.error("Error getting players:", playersError);
      return [];
    }
    
    if (!players || players.length === 0) {
      return [];
    }
    
    const playerStats: PlayerStats[] = [];
    
    for (const player of players) {
      // Get matches where this player participated
      const { data: matchPlayers, error: matchPlayersError } = await supabase
        .from('match_players')
        .select('match_id, team_id, serves_count, receives_count')
        .eq('player_id', player.id);
        
      if (matchPlayersError) {
        console.error(`Error getting matches for player ${player.id}:`, matchPlayersError);
        continue;
      }
      
      if (!matchPlayers || matchPlayers.length === 0) {
        continue;
      }
      
      // Get match details for all matches this player was in
      const matchIds = [...new Set(matchPlayers.map(mp => mp.match_id))];
      
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, winner_id, home_team_id, guest_team_id')
        .in('id', matchIds)
        .eq('completed', true);
        
      if (matchesError) {
        console.error(`Error getting match details for player ${player.id}:`, matchesError);
        continue;
      }
      
      // Calculate stats
      let gamesPlayed = matches?.length || 0;
      let gamesWon = 0;
      let totalServes = 0;
      let totalReceives = 0;
      
      // Calculate total serves and receives
      for (const mp of matchPlayers) {
        totalServes += mp.serves_count || 0;
        totalReceives += mp.receives_count || 0;
      }
      
      // Calculate games won
      for (const match of matches || []) {
        const playerTeamIds = matchPlayers
          .filter(mp => mp.match_id === match.id)
          .map(mp => mp.team_id);
          
        if (playerTeamIds.includes(match.winner_id)) {
          gamesWon++;
        }
      }
      
      const winPercentage = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
      
      playerStats.push({
        id: player.id,
        name: player.name,
        gamesPlayed,
        gamesWon,
        winPercentage,
        totalServes,
        totalReceives
      });
    }
    
    return playerStats;
  } catch (error) {
    console.error("Error calculating player stats:", error);
    return [];
  }
};

export const getTopPlayers = async (limit = 5): Promise<PlayerStats[]> => {
  try {
    const allStats = await getPlayerStats();
    
    return allStats
      .filter(player => player.gamesPlayed >= 3)
      .sort((a, b) => b.winPercentage - a.winPercentage)
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting top players:", error);
    return [];
  }
};
