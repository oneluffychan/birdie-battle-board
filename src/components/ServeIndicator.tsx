
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBadminton } from '@/context/BadmintonContext';
import { Server, MousePointer } from 'lucide-react';

const ServeIndicator: React.FC = () => {
  const { match } = useBadminton();
  
  // Find the serving and receiving players
  const servingPlayer = [...match.homeTeam.players, ...match.guestTeam.players].find(
    player => player.isServing
  );
  
  const receivingPlayer = [...match.homeTeam.players, ...match.guestTeam.players].find(
    player => player.isReceiving
  );

  const isHomeTeamServing = match.homeTeam.players.some(player => player.isServing);

  // Log serving and receiving players for debugging
  useEffect(() => {
    console.log('Current serving player:', servingPlayer?.name);
    console.log('Current receiving player:', receivingPlayer?.name);
    console.log('Home team serving:', isHomeTeamServing);
    console.log('Total score:', match.homeTeam.score + match.guestTeam.score);
  }, [servingPlayer, receivingPlayer, isHomeTeamServing, match.homeTeam.score, match.guestTeam.score]);

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-md p-4 my-4 flex flex-col md:flex-row justify-around items-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex-1 mb-3 md:mb-0">
        <motion.div 
          className="flex items-center gap-2 flex-wrap justify-center md:justify-start"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Server className="h-5 w-5 text-green-600" />
          <span className="text-gray-600 font-medium">Serving:</span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={servingPlayer?.id || 'serving'}
              className={`font-medium px-3 py-1 rounded-full ${
                isHomeTeamServing 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {servingPlayer?.name || 'Unknown'}
            </motion.span>
          </AnimatePresence>
          <motion.span 
            className="text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isHomeTeamServing ? match.homeTeam.name : match.guestTeam.name}
          </motion.span>
        </motion.div>
      </div>
      
      <div className="px-4 text-gray-400 mb-3 md:mb-0">to</div>
      
      <div className="flex-1">
        <motion.div 
          className="flex items-center gap-2 flex-wrap justify-center md:justify-start"
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <MousePointer className="h-5 w-5 text-amber-600" />
          <span className="text-gray-600 font-medium">Receiving:</span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={receivingPlayer?.id || 'receiving'}
              className={`font-medium px-3 py-1 rounded-full ${
                !isHomeTeamServing 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {receivingPlayer?.name || 'Unknown'}
            </motion.span>
          </AnimatePresence>
          <motion.span 
            className="text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {!isHomeTeamServing ? match.homeTeam.name : match.guestTeam.name}
          </motion.span>
        </motion.div>
      </div>

      <div className="mt-3 md:mt-0 text-xs text-gray-500 border-t md:border-t-0 md:border-l border-gray-100 md:pl-4 pt-3 md:pt-0 w-full md:w-auto">
        <p>Score: {match.homeTeam.score}-{match.guestTeam.score}</p>
        <p>Court: {(match.homeTeam.score + match.guestTeam.score) % 2 === 0 ? 'Right' : 'Left'}</p>
      </div>
    </motion.div>
  );
};

export default ServeIndicator;
