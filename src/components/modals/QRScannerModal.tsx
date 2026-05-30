import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

export function QRScannerModal() {
  const { openModal, hideModal, products, cart, addProductToCart } = useApp();
  const open = openModal === 'qr-scanner';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState({ text: 'Position QR code in front of camera', color: '#666' });

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStatus({ text: 'Initializing camera...', color: '#666' });

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          if (cancelled) return;
          const product = products.find((p) => p.productCode === decodedText.trim());
          if (!product) {
            setStatus({ text: `✗ Product not found: ${decodedText}`, color: '#dc3545' });
            setTimeout(() => setStatus({ text: 'Position QR code in front of camera', color: '#666' }), 2000);
            return;
          }
          if (cart.some((item) => item.id === product.id)) {
            setStatus({ text: `⚠ ${product.name} is already in cart`, color: '#ffc107' });
            setTimeout(() => setStatus({ text: 'Position QR code in front of camera', color: '#666' }), 2000);
            return;
          }
          if ((product.quantity || 0) === 0) {
            setStatus({ text: `✗ ${product.name} is out of stock`, color: '#dc3545' });
            setTimeout(() => setStatus({ text: 'Position QR code in front of camera', color: '#666' }), 2000);
            return;
          }
          addProductToCart(product);
          setStatus({ text: `✓ Added ${product.name} to cart`, color: '#28a745' });
          setTimeout(() => hideModal(), 1000);
        },
        () => {},
      )
      .catch((err) => {
        console.error('Error starting QR scanner:', err);
        setStatus({
          text: 'Error: Could not access camera. Please check permissions.',
          color: '#dc3545',
        });
      });

    return () => {
      cancelled = true;
      const stop = async () => {
        try {
          if (scannerRef.current) {
            await scannerRef.current.stop();
          }
          await scannerRef.current?.clear();
        } catch {
          // ignore cleanup errors
        }
        scannerRef.current = null;
      };
      void stop();
    };
  }, [open, products, cart, addProductToCart, hideModal]);

  return (
    <Modal open={open} onClose={hideModal} title="Scan QR Code" wide>
      <div id="qr-reader" style={{ width: '100%' }} />
      <div style={{ textAlign: 'center', color: status.color, marginTop: 10, padding: 10 }}>
        {status.text}
      </div>
      <div style={{ textAlign: 'center', marginTop: 15 }}>
        <button type="button" className="btn-cancel" onClick={hideModal}>Close</button>
      </div>
    </Modal>
  );
}
