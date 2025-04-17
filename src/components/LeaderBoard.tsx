
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPlayerStats, getTopPlayers } from '@/utils/supabaseDB';
import { PlayerStats } from '@/types/badminton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, Star, Server, MousePointer } from 'lucide-react';

const LeaderBoard: React.FC = () => {
  const [allPlayers, setAllPlayers] = useState<PlayerStats[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [top, all] = await Promise.all([
          getTopPlayers(5),
          getPlayerStats()
        ]);
        
        console.log("Top players fetched:", top);
        console.log("All players fetched:", all);
        
        setTopPlayers(top);
        setAllPlayers(all);
      } catch (error) {
        console.error("Error fetching player stats:", error);
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

  if (allPlayers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-8"
      >
        <p className="text-gray-500">No player stats yet. Play some games!</p>
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
