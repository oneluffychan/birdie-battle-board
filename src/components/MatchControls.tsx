
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, RotateCcw, UsersRound, User } from 'lucide-react';
import { useBadminton } from '@/context/BadmintonContext';
import { motion } from 'framer-motion';

const MatchControls: React.FC = () => {
  const { resetMatch, setWinningScore, match, toggleMatchType, isSingles } = useBadminton();
  const [winningScore, setWinningScoreLocal] = useState(match.winningScore.toString());
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleWinningScoreChange = () => {
    const scoreNumber = parseInt(winningScore);
    if (!isNaN(scoreNumber) && scoreNumber > 0) {
      setWinningScore(scoreNumber);
    }
  };

  const shareMatch = async () => {
    try {
      const { homeTeam, guestTeam } = match;
      const shareText = `Badminton Match: ${homeTeam.name} ${homeTeam.score} - ${guestTeam.score} ${guestTeam.name}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Badminton Match Result',
          text: shareText
        });
      } else {
        // Fallback for browsers without Web Share API
        navigator.clipboard.writeText(shareText);
        window.alert('Result copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <motion.div 
      className="flex justify-between items-center w-full py-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
            onClick={toggleMatchType}
          >
            {isSingles ? <User className="h-5 w-5" /> : <UsersRound className="h-5 w-5" />}
            {isSingles ? 'Singles' : 'Doubles'}
          </Button>
        </motion.div>
      </div>

      <div className="flex gap-3">
        {/* Winning Score Setting */}
        <Dialog>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="flex items-center gap-2">
                Win: {match.winningScore}
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Winning Score</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="winning-score">Points needed to win:</Label>
                <Input
                  id="winning-score"
                  type="number"
                  value={winningScore}
                  onChange={(e) => setWinningScoreLocal(e.target.value)}
                  min="1"
                />
                <p className="text-sm text-gray-500">
                  A player needs to be ahead by 2 points to win after reaching this score.
                </p>
              </div>
              <Button onClick={handleWinningScoreChange} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="outline" 
            onClick={resetMatch}
            className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset
          </Button>
        </motion.div>

        {/* Share Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="outline" 
            onClick={shareMatch}
            className="bg-purple-500 text-white hover:bg-purple-600"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MatchControls;
