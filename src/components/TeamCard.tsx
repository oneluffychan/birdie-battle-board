
import React, { useState } from 'react';
import { Team, Player } from '@/types/badminton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, MinusCircle, Edit, Check } from 'lucide-react';
import { useBadminton } from '@/context/BadmintonContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamCardProps {
  team: Team;
}

const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  const { updateTeamName, updatePlayerName, incrementScore, decrementScore } = useBadminton();
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState(team.name);
  const [editingPlayerNames, setEditingPlayerNames] = useState<{ [key: string]: string }>(
    team.players.reduce((acc, player) => {
      acc[player.id] = player.name;
      return acc;
    }, {} as { [key: string]: string })
  );

  const handleTeamNameEdit = () => {
    updateTeamName(team.id, editingTeamName);
    setIsEditingTeamName(false);
  };

  const handlePlayerNameEdit = () => {
    Object.entries(editingPlayerNames).forEach(([playerId, name]) => {
      updatePlayerName(team.id, playerId, name);
    });
    setIsEditingPlayers(false);
  };

  const handleAddPoint = () => {
    incrementScore(team.id);
  };

  const handleRemovePoint = () => {
    decrementScore(team.id);
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-6 relative flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`${team.isHomeTeam ? 'bg-gradient-home' : 'bg-gradient-guest'} rounded-t-xl absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 py-2 text-white`}>
        <AnimatePresence mode="wait">
          {isEditingTeamName ? (
            <motion.div 
              className="flex items-center gap-2 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Input
                value={editingTeamName}
                onChange={(e) => setEditingTeamName(e.target.value)}
                className="h-8 text-gray-900 w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleTeamNameEdit()}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleTeamNameEdit}
                className="h-8 w-8 hover:bg-white/20"
              >
                <Check className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-xl font-bold">{team.name}</h2>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsEditingTeamName(true)}
                className="h-8 w-8 hover:bg-white/20"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button variant="ghost" onClick={() => setIsEditingPlayers(!isEditingPlayers)}>
          Edit
        </Button>
      </div>

      <div className="mt-16 mb-4">
        <p className="text-gray-600 mb-2">Players:</p>
        <ul className="space-y-2">
          {team.players.map((player) => (
            <motion.li 
              key={player.id}
              className="flex items-center justify-between"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                {isEditingPlayers ? (
                  <Input
                    value={editingPlayerNames[player.id]}
                    onChange={(e) => 
                      setEditingPlayerNames({
                        ...editingPlayerNames,
                        [player.id]: e.target.value,
                      })
                    }
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handlePlayerNameEdit()}
                  />
                ) : (
                  <span className={`font-medium ${team.isHomeTeam ? 'text-blue-600' : 'text-purple-600'}`}>
                    {player.name}
                  </span>
                )}
              </div>
              
              {player.isServing && (
                <motion.span 
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  Serving
                </motion.span>
              )}
              
              {player.isReceiving && (
                <motion.span 
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  Receiving
                </motion.span>
              )}
            </motion.li>
          ))}
        </ul>
        
        {isEditingPlayers && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={handlePlayerNameEdit}>
              Save Names
            </Button>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRemovePoint}
            className="rounded-full h-12 w-12 border-2 hover:bg-gray-100"
          >
            <MinusCircle className="h-6 w-6" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddPoint}
            className={`rounded-full h-12 w-12 border-2 ${
              team.isHomeTeam ? 'text-blue-600 hover:bg-blue-50' : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            <PlusCircle className="h-6 w-6" />
          </Button>
        </div>
        
        <motion.div 
          className={`text-7xl font-bold ${
            team.isHomeTeam ? 'text-blue-600' : 'text-purple-600'
          }`}
          key={team.score}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 0.3 }}
        >
          {team.score}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TeamCard;
