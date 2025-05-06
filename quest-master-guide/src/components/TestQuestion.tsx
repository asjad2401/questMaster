import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideUp, SlideInLeft, ScaleIn, MotionButton } from './animations';

interface Option {
  id: string;
  text: string;
}

interface TestQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  options: Option[];
  onNext: (selectedOption: string) => void;
  onPrevious: () => void;
  selectedOption?: string;
  timeRemaining?: string;
}

const TestQuestion = ({
  questionNumber,
  totalQuestions,
  questionText,
  options,
  onNext,
  onPrevious,
  selectedOption,
  timeRemaining,
}: TestQuestionProps) => {
  const [selected, setSelected] = useState<string>(selectedOption || '');

  useEffect(() => {
    setSelected(selectedOption || '');
  }, [questionNumber, selectedOption]);

  const handleOptionChange = (value: string) => {
    setSelected(value);
  };

  const handleNext = () => {
    onNext(selected);
  };

  return (
    <motion.div 
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <SlideInLeft className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <span className="font-semibold text-2xl text-exam-primary dark:text-blue-400">Question {questionNumber}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">of {totalQuestions}</span>
        </div>
        {timeRemaining && (
          <motion.div 
            className="bg-exam-primary text-white py-1 px-3 rounded-full text-sm font-medium"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Time: {timeRemaining}
          </motion.div>
        )}
      </SlideInLeft>

      <ScaleIn>
        <Card className="mb-6 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="pt-6">
            <motion.div 
              className="prose max-w-none dark:prose-invert"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-lg mb-6 dark:text-white" dangerouslySetInnerHTML={{ __html: questionText }} />
            </motion.div>

            <RadioGroup value={selected} onValueChange={handleOptionChange} className="space-y-4 mt-6">
              <AnimatePresence>
                {options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    className={`exam-option ${selected === option.id ? 'exam-option-selected' : ''}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label 
                      htmlFor={option.id} 
                      className="flex-1 cursor-pointer dark:text-white"
                      dangerouslySetInnerHTML={{ __html: option.text }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </RadioGroup>
          </CardContent>
        </Card>
      </ScaleIn>

      <SlideUp className="flex justify-between">
        <MotionButton 
          variant="outline" 
          onClick={onPrevious}
          disabled={questionNumber === 1}
          className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Previous
        </MotionButton>
        <MotionButton 
          onClick={handleNext}
          disabled={!selected}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {questionNumber === totalQuestions ? 'Submit' : 'Next'}
        </MotionButton>
      </SlideUp>
    </motion.div>
  );
};

export default TestQuestion;
