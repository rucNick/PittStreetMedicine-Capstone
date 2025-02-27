import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VolunteerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8080/api/orders/all')
            .then(response => {
                setOrders(response.data);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message || 'Error fetching orders');
                setLoading(false);
            });
    }, []);

    const updateOrderStatus = (orderId, newStatus) => {
        axios.put(`http://localhost:8080/api/orders/${orderId}/status`, { status: newStatus })
            .then(() => {
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order.id === orderId ? { ...order, status: newStatus } : order
                    )
                );
            })
            .catch(error => alert('Failed to update order status: ' + error.message));
    };

    if (loading) return <p>Loading orders...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>Volunteer Orders</h2>
            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Target User</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.targetUserId}</td>
                            <td>{order.status}</td>
                            <td>
                                <button onClick={() => updateOrderStatus(order.id, 'Completed')}>Mark as Completed</button>
                                <button onClick={() => updateOrderStatus(order.id, 'Canceled')} style={{ marginLeft: '10px' }}>Cancel</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default VolunteerOrders;