
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, Pause, Users, Award } from 'lucide-react';
import { useBadminton } from '@/context/BadmintonContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import PlayerRoster from './PlayerRoster';

const MatchControls = () => {
  const { resetMatch, completeMatch, setWinningScore, toggleMatchType, isSingles, match } = useBadminton();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleReset = () => {
    if (showConfirmReset) {
      resetMatch();
      setShowConfirmReset(false);
    } else {
      setShowConfirmReset(true);
    }
  };

  const handleWinningScoreChange = (value: string) => {
    setWinningScore(parseInt(value));
  };

  return (
    <motion.div
      className="mb-6 p-4 bg-white rounded-xl shadow-sm flex flex-wrap gap-3 justify-between items-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex gap-2 items-center">
        <Button
          variant={showConfirmReset ? "destructive" : "outline"}
          size="sm"
          onClick={handleReset}
          className="flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          {showConfirmReset ? "Confirm Reset" : "Reset Match"}
        </Button>

        <Button 
          variant="outline"
          size="sm"
          onClick={toggleMatchType}
          className="flex items-center gap-1"
        >
          <Users className="h-4 w-4" />
          {isSingles ? "Singles" : "Doubles"}
        </Button>

        <Button 
          variant="outline"
          size="sm" 
          onClick={completeMatch}
          disabled={match.completed}
          className="flex items-center gap-1"
        >
          <Award className="h-4 w-4" />
          Complete Match
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        <PlayerRoster />
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Winning Score:</span>
          <Select
            value={match.winningScore.toString()}
            onValueChange={handleWinningScoreChange}
          >
            <SelectTrigger className="w-[80px] h-9">
              <SelectValue placeholder="21" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="11">11</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="21">21</SelectItem>
              <SelectItem value="30">30</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchControls;
