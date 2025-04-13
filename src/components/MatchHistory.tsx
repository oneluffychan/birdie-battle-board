
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getGameHistory } from '@/utils/supabaseDB';
import { GameHistory } from '@/types/badminton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const MatchHistory: React.FC = () => {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await getGameHistory();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching match history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Function to determine if the match was won in a deuce situation
  const isDeuceWin = (homeScore: number, guestScore: number): boolean => {
    return (homeScore >= 21 && guestScore >= 20) || (guestScore >= 21 && homeScore >= 20);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-8"
      >
        <p className="text-gray-500">Loading match history...</p>
      </motion.div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-8"
      >
        <p className="text-gray-500">No match history yet. Play some games!</p>
      </motion.div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {history.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      {format(new Date(game.date), 'MMM d, yyyy')}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {format(new Date(game.date), 'h:mm a')}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center">
                      <Badge 
                        variant={game.winner === 'home' ? 'secondary' : 'default'} 
                        className="ml-2"
                      >
                        {game.winner === 'home' ? game.homeTeam.name : game.guestTeam.name} Win
                      </Badge>
                      <Trophy className="h-4 w-4 ml-1 text-yellow-500" />
                      {isDeuceWin(game.homeTeam.score, game.guestTeam.score) && (
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                          Deuce Win
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center">
                        <span>Players: {[...game.homeTeam.players, ...game.guestTeam.players].join(', ')}</span>
                        <Info className="h-3 w-3 ml-1 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Match ID: {game.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <p className="font-semibold text-blue-600">{game.homeTeam.name}</p>
                      <p className="text-3xl font-bold">{game.homeTeam.score}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {game.homeTeam.players.join(', ')}
                      </div>
                    </div>
                    
                    <Separator orientation="vertical" className="h-16" />
                    
                    <div className="text-center flex-1">
                      <p className="font-semibold text-purple-600">{game.guestTeam.name}</p>
                      <p className="text-3xl font-bold">{game.guestTeam.score}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {game.guestTeam.players.join(', ')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
};

export default MatchHistory;
