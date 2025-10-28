import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorialSlideshow from '../components/TutorialSlideshow';

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  };

  useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
      <TutorialSlideshow isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}
