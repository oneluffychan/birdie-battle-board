
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
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id, 
        date, 
        home_team_score, 
        guest_team_score, 
        completed,
        winner_id,
        teams!matches_home_team_id_fkey (id, name),
        teams!matches_guest_team_id_fkey (id, name)
      `)
      .order('date', { ascending: false });
    
    if (matchesError) {
      console.error("Error getting match history:", matchesError);
      return [];
    }
    
    const gameHistory: GameHistory[] = [];
    
    for (const match of matches || []) {
      // Get home team players
      const { data: homePlayers } = await supabase
        .from('match_players')
        .select('players(name)')
        .eq('match_id', match.id)
        .eq('team_id', match.teams.id);
      
      // Get guest team players
      const { data: guestPlayers } = await supabase
        .from('match_players')
        .select('players(name)')
        .eq('match_id', match.id)
        .eq('team_id', match.teams.id);
      
      const homeTeam = match.teams.find((team: any) => team.id === match.home_team_id);
      const guestTeam = match.teams.find((team: any) => team.id === match.guest_team_id);
      
      gameHistory.push({
        id: match.id,
        date: match.date,
        homeTeam: {
          name: homeTeam?.name || 'Home Team',
          players: homePlayers?.map((p: any) => p.players.name) || [],
          score: match.home_team_score
        },
        guestTeam: {
          name: guestTeam?.name || 'Guest Team',
          players: guestPlayers?.map((p: any) => p.players.name) || [],
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
  playerTeamId: string, 
  isServing: boolean, 
  isReceiving: boolean
): Promise<void> => {
  try {
    const players = match.homeTeam.id === playerTeamId 
      ? match.homeTeam.players 
      : match.guestTeam.players;
      
    for (const player of players) {
      // Update serves and receives counts
      const { error } = await supabase
        .from('match_players')
        .update({
          serves_count: supabase.sql`serves_count + ${isServing ? 1 : 0}`,
          receives_count: supabase.sql`receives_count + ${isReceiving ? 1 : 0}`
        })
        .eq('match_id', match.id)
        .eq('player_id', player.id);
        
      if (error) {
        console.error("Error updating player stats:", error);
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
      gamesPlayed: player.games_played,
      gamesWon: player.games_won,
      winPercentage: player.win_percentage,
      totalServes: player.total_serves,
      totalReceives: player.total_receives
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
      gamesPlayed: player.games_played,
      gamesWon: player.games_won,
      winPercentage: player.win_percentage,
      totalServes: player.total_serves,
      totalReceives: player.total_receives
    }));
  } catch (error) {
    console.error("Error getting top players:", error);
    return [];
  }
};
