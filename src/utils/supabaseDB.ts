
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
    // Check if home and guest teams already exist, create them if they don't
    const homeTeamResponse = await supabase
      .from('teams')
      .insert({
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        is_home_team: true,
        color: match.homeTeam.color
      })
      .select()
      .single();
      
    const guestTeamResponse = await supabase
      .from('teams')
      .insert({
        id: match.guestTeam.id,
        name: match.guestTeam.name,
        is_home_team: false,
        color: match.guestTeam.color
      })
      .select()
      .single();
    
    const homeTeamId = homeTeamResponse.data?.id || match.homeTeam.id;
    const guestTeamId = guestTeamResponse.data?.id || match.guestTeam.id;
    const winnerId = match.winner?.id || null;
    
    // Create match record
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
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
    const matchPlayers: SupabaseMatchPlayer[] = [];
    
    // Add home team players
    match.homeTeam.players.forEach(player => {
      matchPlayers.push({
        match_id: match.id,
        team_id: homeTeamId,
        player_id: player.id,
        serves_count: player.isServing ? 1 : 0,
        receives_count: player.isReceiving ? 1 : 0
      });
    });
    
    // Add guest team players
    match.guestTeam.players.forEach(player => {
      matchPlayers.push({
        match_id: match.id,
        team_id: guestTeamId,
        player_id: player.id,
        serves_count: player.isServing ? 1 : 0,
        receives_count: player.isReceiving ? 1 : 0
      });
    });
    
    // Save match players
    const { error: playersError } = await supabase
      .from('match_players')
      .insert(matchPlayers);
      
    if (playersError) {
      console.error("Error saving match players:", playersError);
    }
  } catch (error) {
    console.error("Error saving game history:", error);
  }
};

export const getGameHistory = async (): Promise<GameHistory[]> => {
  try {
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
      .order('date', { ascending: false });
    
    if (matchesError) {
      console.error("Error getting match history:", matchesError);
      return [];
    }

    // Fetch home teams
    const { data: homeTeams, error: homeTeamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', matches.map(match => match.home_team_id));

    if (homeTeamsError) {
      console.error("Error getting home teams:", homeTeamsError);
      return [];
    }

    // Fetch guest teams
    const { data: guestTeams, error: guestTeamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', matches.map(match => match.guest_team_id));

    if (guestTeamsError) {
      console.error("Error getting guest teams:", guestTeamsError);
      return [];
    }
    
    const gameHistory: GameHistory[] = [];
    
    for (const match of matches || []) {
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

      // Get player names for guest team
      const { data: guestPlayers, error: guestPlayerNamesError } = await supabase
        .from('players')
        .select('name')
        .in('id', guestPlayerMatches.map(pm => pm.player_id));

      if (guestPlayerNamesError) {
        console.error("Error getting guest player names:", guestPlayerNamesError);
        continue;
      }
      
      const homeTeam = homeTeams.find(team => team.id === match.home_team_id);
      const guestTeam = guestTeams.find(team => team.id === match.guest_team_id);
      
      gameHistory.push({
        id: match.id,
        date: match.date,
        homeTeam: {
          name: homeTeam?.name || 'Home Team',
          players: homePlayers.map(p => p.name),
          score: match.home_team_score
        },
        guestTeam: {
          name: guestTeam?.name || 'Guest Team',
          players: guestPlayers.map(p => p.name),
          score: match.guest_team_score
        },
        winner: match.winner_id === match.home_team_id ? 'home' : 'guest'
      });
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
    const { data, error } = await supabase
      .from('player_stats')
      .select('id, name, games_played, games_won, win_percentage, total_serves, total_receives');
      
    if (error) {
      console.error("Error getting player stats:", error);
      return [];
    }
    
    return (data || []).map(player => ({
      id: player.id,
      name: player.name,
      gamesPlayed: player.games_played || 0,
      gamesWon: player.games_won || 0,
      winPercentage: player.win_percentage || 0,
      totalServes: player.total_serves || 0,
      totalReceives: player.total_receives || 0
    }));
  } catch (error) {
    console.error("Error getting player stats:", error);
    return [];
  }
};

// Get top players sorted by win percentage
export const getTopPlayers = async (limit = 5): Promise<PlayerStats[]> => {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('id, name, games_played, games_won, win_percentage, total_serves, total_receives')
      .gte('games_played', 3)
      .order('win_percentage', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error getting top players:", error);
      return [];
    }
    
    return (data || []).map(player => ({
      id: player.id,
      name: player.name,
      gamesPlayed: player.games_played || 0,
      gamesWon: player.games_won || 0,
      winPercentage: player.win_percentage || 0,
      totalServes: player.total_serves || 0,
      totalReceives: player.total_receives || 0
    }));
  } catch (error) {
    console.error("Error getting top players:", error);
    return [];
  }
};
