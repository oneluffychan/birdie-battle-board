
export interface Player {
  id: string;
  name: string;
  isServing?: boolean;
  isReceiving?: boolean;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  score: number;
  color: string;
  isHomeTeam: boolean;
}

export interface Match {
  id: string;
  date: string;
  homeTeam: Team;
  guestTeam: Team;
  winningScore: number;
  winner?: Team;
  completed: boolean;
}

export interface GameHistory {
  id: string;
  date: string;
  homeTeam: {
    name: string;
    players: string[];
    score: number;
  };
  guestTeam: {
    name: string;
    players: string[];
    score: number;
  };
  winner: 'home' | 'guest';
}

export interface PlayerStats {
  id: string;
  name: string;
  gamesPlayed: number;
  gamesWon: number;
  winPercentage: number;
  totalServes?: number;
  totalReceives?: number;
}

export interface PlayerRoster {
  id: string;
  name: string;
}
