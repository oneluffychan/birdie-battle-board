
import React from 'react';
import { motion } from 'framer-motion';
import { getPlayerStats, getTopPlayers } from '@/utils/localStorageDB';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, Star } from 'lucide-react';

const LeaderBoard: React.FC = () => {
  const allPlayers = getPlayerStats();
  const topPlayers = getTopPlayers(5);

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPlayers.map((player, index) => (
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
                  </motion.tr>
                ))}
                
                {topPlayers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPlayers
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
                    </motion.tr>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LeaderBoard;
