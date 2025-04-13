
import { nanoid } from 'nanoid';
import { PlayerRoster } from '@/types/badminton';

const PLAYER_ROSTER_KEY = "badminton_player_roster";

export const getPlayerRoster = (): PlayerRoster[] => {
  try {
    const roster = localStorage.getItem(PLAYER_ROSTER_KEY);
    return roster ? JSON.parse(roster) : [];
  } catch (error) {
    console.error("Error getting player roster:", error);
    return [];
  }
};

export const addPlayerToRoster = (name: string): PlayerRoster => {
  try {
    const roster = getPlayerRoster();
    const newPlayer = {
      id: nanoid(),
      name: name.trim()
    };
    
    // Check if player with same name already exists
    if (!roster.find(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      localStorage.setItem(PLAYER_ROSTER_KEY, JSON.stringify([...roster, newPlayer]));
    }
    
    return newPlayer;
  } catch (error) {
    console.error("Error adding player to roster:", error);
    return { id: nanoid(), name };
  }
};

export const removePlayerFromRoster = (id: string): void => {
  try {
    const roster = getPlayerRoster();
    localStorage.setItem(
      PLAYER_ROSTER_KEY, 
      JSON.stringify(roster.filter(p => p.id !== id))
    );
  } catch (error) {
    console.error("Error removing player from roster:", error);
  }
};
