
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import TeamCard from '@/components/TeamCard';
import ServeIndicator from '@/components/ServeIndicator';
import MatchControls from '@/components/MatchControls';
import MatchHistory from '@/components/MatchHistory';
import LeaderBoard from '@/components/LeaderBoard';
import { BadmintonProvider, useBadminton } from '@/context/BadmintonContext';
import { Shuttlecock } from '@/components/icons/Shuttlecock';

const ScoreKeeper = () => {
  const { match } = useBadminton();

  return (
    <motion.div
      className="container mx-auto p-4 max-w-6xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-center mb-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
      >
        <h1 className="text-5xl font-bold text-primary mb-2 flex justify-center items-center gap-3">
          <span className="relative">
            <span className="absolute -top-1 -left-1">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Shuttlecock className="h-10 w-10 text-secondary opacity-20" />
              </motion.div>
            </span>
            Badminton Scorekeeper
          </span>
        </h1>
        <motion.p 
          className="text-xl text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Track your Sunday badminton matches with style!
        </motion.p>
      </motion.div>

      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl p-6 shadow-lg">
        <MatchControls />
        
        <ServeIndicator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <TeamCard team={match.homeTeam} />
          <TeamCard team={match.guestTeam} />
        </div>
        
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">Winning Score:</span>
            <Badge variant="outline" className="bg-white px-3 py-1">
              {match.winningScore} points
            </Badge>
          </div>
          
          {match.completed && (
            <motion.div 
              className="bg-green-100 text-green-800 px-4 py-2 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              Match Complete! Winner: {match.winner?.name}
            </motion.div>
          )}
        </motion.div>
      </div>

      <motion.div 
        className="mt-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Match History</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-6">
            <MatchHistory />
          </TabsContent>
          <TabsContent value="leaderboard" className="mt-6">
            <LeaderBoard />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

const Index = () => {
  return (
    <BadmintonProvider>
      <ScoreKeeper />
    </BadmintonProvider>
  );
};

export default Index;
