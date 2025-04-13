
import React from 'react';
import { motion } from 'framer-motion';
import { useBadminton } from '@/context/BadmintonContext';

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

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-md p-4 my-4 flex justify-around items-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex-1">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-gray-600">Serving:</span>
          <motion.span 
            className={`font-medium px-3 py-1 rounded-full ${
              isHomeTeamServing 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}
            key={servingPlayer?.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {servingPlayer?.name || 'Unknown'}
          </motion.span>
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
      
      <div className="px-4 text-gray-400">to</div>
      
      <div className="flex-1">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-gray-600">Receiving:</span>
          <motion.span 
            className={`font-medium px-3 py-1 rounded-full ${
              !isHomeTeamServing 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}
            key={receivingPlayer?.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {receivingPlayer?.name || 'Unknown'}
          </motion.span>
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
    </motion.div>
  );
};

export default ServeIndicator;
