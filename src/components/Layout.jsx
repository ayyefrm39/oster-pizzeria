import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StickyCart from '@/components/StickyCart';
import OrderTypeSelector from '@/components/OrderTypeSelector';

export default function Layout() {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const navigate = useNavigate();

  const handleOrderSelect = (type) => {
    navigate('/meny');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header onOrderClick={() => setShowTypeSelector(true)} />
      <main className="flex-1">
        <Outlet context={{ openOrderType: () => setShowTypeSelector(true) }} />
      </main>
      <Footer />
      <div className="h-20 md:h-0" aria-hidden />
      <StickyCart />
      <OrderTypeSelector open={showTypeSelector} onClose={() => setShowTypeSelector(false)} onSelect={handleOrderSelect} />
    </div>
  );
}
