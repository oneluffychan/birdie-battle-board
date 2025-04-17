
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPlayerStats, getTopPlayers } from '@/utils/supabaseDB';
import { PlayerStats } from '@/types/badminton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, Star, Server, MousePointer, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const LeaderBoard: React.FC = () => {
  const [allPlayers, setAllPlayers] = useState<PlayerStats[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching player statistics...");
        
        const [top, all] = await Promise.all([
          getTopPlayers(5),
          getPlayerStats()
        ]);
        
        console.log("Top players raw data:", top);
        console.log("All players raw data:", all);
        
        // Validate data before setting state
        if (!Array.isArray(all)) {
          console.error("Invalid player stats format:", all);
          setError("Failed to load player data: Invalid format");
          return;
        }
        
        // Make sure we have valid data with the required properties
        const validatedAll = all
          .filter(player => player && typeof player === 'object')
          .map(player => ({
            id: player.id || 'unknown',
            name: player.name || 'Unknown Player',
            gamesPlayed: player.gamesPlayed || 0,
            gamesWon: player.gamesWon || 0,
            winPercentage: player.winPercentage || 0,
            totalServes: player.totalServes || 0,
            totalReceives: player.totalReceives || 0
          }));
        
        // Validate and sort top players by win percentage
        const validatedTop = Array.isArray(top) 
          ? top
              .filter(player => player && typeof player === 'object' && player.gamesPlayed >= 3)
              .sort((a, b) => b.winPercentage - a.winPercentage)
              .slice(0, 5)
          : [];
        
        console.log("Validated top players:", validatedTop);
        console.log("Validated all players:", validatedAll);
        
        setTopPlayers(validatedTop);
        setAllPlayers(validatedAll);
        
        if (validatedAll.length === 0) {
          console.warn("No player data available");
        }
      } catch (error) {
        console.error("Error fetching player stats:", error);
        setError("Failed to load player statistics");
        toast({
          title: "Error loading leaderboard",
          description: "There was a problem fetching player statistics",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-8"
      >
        <p className="text-gray-500">Loading player stats...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-red-50 border border-red-200 rounded-md p-4 text-center"
      >
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <p className="text-gray-600 mt-2 text-sm">Please try again later or contact support.</p>
      </motion.div>
    );
  }

  if (allPlayers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-8 bg-gray-50 border border-gray-200 rounded-md"
      >
        <p className="text-gray-500 my-4">No player stats yet. Play some games!</p>
      </motion.div>
    );
  }

  // Animations
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-700" />;
      default: return <Star className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Players
          </CardTitle>
          <CardDescription>
            Players ranked by win percentage (minimum 3 games)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                  <TableHead className="text-right">W/L</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Server className="h-4 w-4" />
                      <span>Serves</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MousePointer className="h-4 w-4" />
                      <span>Receives</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPlayers.length > 0 ? (
                  topPlayers.map((player, index) => (
                    <motion.tr
                      key={player.id}
                      variants={item}
                      className={index % 2 === 0 ? 'bg-muted/50' : undefined}
                    >
                      <TableCell className="font-medium flex items-center">
                        {getIcon(index)}
                        <span className="ml-1">{index + 1}</span>
                      </TableCell>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={index === 0 ? 'default' : 'outline'} 
                          className={index === 0 ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                        >
                          {player.winPercentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{player.gamesWon}/{player.gamesPlayed - player.gamesWon}</TableCell>
                      <TableCell className="text-right">{player.gamesPlayed}</TableCell>
                      <TableCell className="text-right">{player.totalServes || 0}</TableCell>
                      <TableCell className="text-right">{player.totalReceives || 0}</TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No qualified players yet (need at least 3 games)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Players</CardTitle>
          <CardDescription>
            Stats for all players who have played games
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="text-right">Serves</TableHead>
                  <TableHead className="text-right">Receives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPlayers.length > 0 ? (
                  allPlayers
                    .sort((a, b) => b.winPercentage - a.winPercentage)
                    .map((player, index) => (
                      <motion.tr
                        key={player.id}
                        variants={item}
                        className={index % 2 === 0 ? 'bg-muted/50' : undefined}
                      >
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell className="text-right">{player.winPercentage}%</TableCell>
                        <TableCell className="text-right">{player.gamesWon}</TableCell>
                        <TableCell className="text-right">{player.gamesPlayed}</TableCell>
                        <TableCell className="text-right">{player.totalServes || 0}</TableCell>
                        <TableCell className="text-right">{player.totalReceives || 0}</TableCell>
                      </motion.tr>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No player stats available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LeaderBoard;
