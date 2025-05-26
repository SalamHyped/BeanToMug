export default function Dashboard() {
  return (
    <div>
      <h1>Customer Dashboard</h1>
      <p>Welcome to your dashboard!</p>
      <p>Here you can view your orders, update your profile, and manage your account settings.</p>
      {/* Add links or buttons to navigate to different sections */}
      <ul>
        <li><a href="/customer/orders">View Orders</a></li>
        <li><a href="/customer/profile">Update Profile</a></li>
        <li><a href="/customer/settings">Account Settings</a></li>
      </ul>
    </div>
  );
}