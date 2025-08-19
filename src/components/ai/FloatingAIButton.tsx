import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AIChat } from './AIChat';
import { Bot } from 'lucide-react';

export const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ 
    x: window.innerWidth / 2 - 56, 
    y: window.innerHeight / 2 - 56 
  });

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // 🖱 Mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    setPosition(prev => ({
      x: Math.min(Math.max(0, e.clientX - offset.current.x), window.innerWidth - 64),
      y: Math.min(Math.max(0, e.clientY - offset.current.y), window.innerHeight - 64),
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 📱 Touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging.current) return;
    const touch = e.touches[0];
    setPosition({
      x: Math.min(Math.max(0, touch.clientX - offset.current.x), window.innerWidth - 64),
      y: Math.min(Math.max(0, touch.clientY - offset.current.y), window.innerHeight - 64),
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragging.current = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    const touch = e.touches[0];
    offset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            zIndex: 50,
            height: '3.5rem',
            width: '3.5rem',
            borderRadius: '9999px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            transition: 'box-shadow 0.2s',
            cursor: 'grab',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-6">
        <DialogHeader className="sr-only">
          <DialogTitle>AI Health Assistant</DialogTitle>
        </DialogHeader>
        <AIChat />
      </DialogContent>
    </Dialog>
  );
};
