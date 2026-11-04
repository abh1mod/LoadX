import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../socket';

/**
 * Real-time WebSocket hook for a shipment.
 * Subscribes to the shipment's WebSocket room and listens for:
 * - 'bids_updated': real-time reverse auction leaderboard updates
 * - 'milestone_updated': real-time milestone transitions and delivery confirmation
 * - 'shipment_updated': real-time status transitions (e.g. OPEN -> CLOSED, AWARDED)
 *
 * Eliminates short-polling by receiving instant push events.
 */
export const useShipmentSocket = (shipmentId, { onBidsUpdate, onMilestoneUpdate, onShipmentUpdate } = {}) => {
  const [connected, setConnected] = useState(false);
  const [liveBids, setLiveBids] = useState(null);

  const onBidsRef = useRef(onBidsUpdate);
  const onMilestoneRef = useRef(onMilestoneUpdate);
  const onShipmentRef = useRef(onShipmentUpdate);

  useEffect(() => {
    onBidsRef.current = onBidsUpdate;
    onMilestoneRef.current = onMilestoneUpdate;
    onShipmentRef.current = onShipmentUpdate;
  });

  useEffect(() => {
    if (!shipmentId) return;

    const socket = getSocket();

    const handleConnect = () => {
      setConnected(true);
      socket.emit('join_shipment', shipmentId);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    if (socket.connected) {
      setConnected(true);
      socket.emit('join_shipment', shipmentId);
    } else {
      socket.connect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    const handleBids = (data) => {
      setLiveBids(data);
      if (onBidsRef.current) {
        onBidsRef.current(data);
      }
    };

    const handleMilestone = (data) => {
      if (onMilestoneRef.current) {
        onMilestoneRef.current(data);
      }
    };

    const handleShipment = (data) => {
      if (onShipmentRef.current) {
        onShipmentRef.current(data);
      }
    };

    socket.on('bids_updated', handleBids);
    socket.on('milestone_updated', handleMilestone);
    socket.on('shipment_updated', handleShipment);

    return () => {
      socket.emit('leave_shipment', shipmentId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('bids_updated', handleBids);
      socket.off('milestone_updated', handleMilestone);
      socket.off('shipment_updated', handleShipment);
    };
  }, [shipmentId]);

  return {
    connected,
    liveBids,
    setLiveBids
  };
};

export default useShipmentSocket;
