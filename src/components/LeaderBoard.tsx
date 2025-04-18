
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPlayerStats, getTopPlayers } from '@/utils/supabaseDB';
import { PlayerStats } from '@/types/badminton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';
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
        
        if (!Array.isArray(all)) {
          console.error("Invalid player stats format:", all);
          setError("Failed to load player data: Invalid format");
          return;
        }
        
        setTopPlayers(top);
        setAllPlayers(all);
        
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
        className="bg-destructive/10 border border-destructive rounded-md p-4 text-center"
      >
        <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
        <p className="text-destructive">{error}</p>
        <p className="text-muted-foreground mt-2 text-sm">Please try again later or contact support.</p>
      </motion.div>
    );
  }

  if (allPlayers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-8 bg-muted/50 border border-border rounded-md"
      >
        <p className="text-muted-foreground my-4">No player stats yet. Play some games!</p>
      </motion.div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <Card className="bg-card">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-card-foreground">Top Players</CardTitle>
          <CardDescription className="text-muted-foreground">
            Players ranked by win percentage (minimum 3 games)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Games Played</TableHead>
                <TableHead>Games Won</TableHead>
                <TableHead>Win %</TableHead>
                <TableHead>Total Serves</TableHead>
                <TableHead>Total Receives</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.gamesPlayed}</TableCell>
                  <TableCell>{player.gamesWon}</TableCell>
                  <TableCell>{player.winPercentage}%</TableCell>
                  <TableCell>{player.totalServes}</TableCell>
                  <TableCell>{player.totalReceives}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card className="bg-card">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-card-foreground">All Players</CardTitle>
          <CardDescription className="text-muted-foreground">
            Stats for all players who have played games
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Games Played</TableHead>
                <TableHead>Games Won</TableHead>
                <TableHead>Win %</TableHead>
                <TableHead>Total Serves</TableHead>
                <TableHead>Total Receives</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.gamesPlayed}</TableCell>
                  <TableCell>{player.gamesWon}</TableCell>
                  <TableCell>{player.winPercentage}%</TableCell>
                  <TableCell>{player.totalServes}</TableCell>
                  <TableCell>{player.totalReceives}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LeaderBoard;

