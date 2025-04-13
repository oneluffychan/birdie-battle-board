
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlayerRoster as PlayerRosterType } from '@/types/badminton';
import { getPlayerRoster, addPlayerToRoster, removePlayerFromRoster } from '@/utils/supabaseDB';
import { X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const PlayerRoster = () => {
  const [players, setPlayers] = useState<PlayerRosterType[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      const data = await getPlayerRoster();
      setPlayers(data);
      setLoading(false);
    };

    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen]);

  const handleAddPlayer = async () => {
    if (newPlayerName.trim().length < 2) {
      toast({
        title: "Invalid Name",
        description: "Player name must be at least 2 characters",
        variant: "destructive"
      });
      return;
    }

    if (players.some(p => p.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      toast({
        title: "Duplicate Player",
        description: "A player with this name already exists",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const newPlayer = await addPlayerToRoster(newPlayerName);
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    setLoading(false);
    
    toast({
      title: "Player Added",
      description: `${newPlayer.name} has been added to the roster`
    });
  };

  const handleRemovePlayer = async (id: string, name: string) => {
    setLoading(true);
    await removePlayerFromRoster(id);
    setPlayers(players.filter(p => p.id !== id));
    setLoading(false);
    
    toast({
      title: "Player Removed",
      description: `${name} has been removed from the roster`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Manage Players
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Player Roster</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mt-4">
          <Input
            placeholder="Enter player name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
            className="flex-1"
          />
          <Button onClick={handleAddPlayer} disabled={newPlayerName.trim().length < 2 || loading}>
            Add
          </Button>
        </div>
        
        <div className="mt-4 max-h-[300px] overflow-y-auto">
          <AnimatePresence>
            {loading ? (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-500 py-4"
              >
                Loading players...
              </motion.p>
            ) : players.length === 0 ? (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-500 py-4"
              >
                No players in roster. Add some players to get started!
              </motion.p>
            ) : (
              <ul className="space-y-2">
                {players.map(player => (
                  <motion.li
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <span className="font-medium">{player.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePlayer(player.id, player.name)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </motion.li>
                ))}
              </ul>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerRoster;
