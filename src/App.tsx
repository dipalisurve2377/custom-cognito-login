import { AuthProvider } from "./contexts/AuthContext";
import LoginForm from "./components/auth/LoginForm";
import NewPasswordForm from "./components/auth/NewPasswordForm";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";

// Main app content component
const AppContent: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    logout,
    requiresNewPassword,
    userAttributes,
    cognitoUser,
    setNewPassword,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (requiresNewPassword && cognitoUser && userAttributes) {
    return (
      <NewPasswordForm
        cognitoUser={cognitoUser}
        userAttributes={userAttributes}
        onSuccess={() => {
          // This will be handled by the context
        }}
        onCancel={() => {
          // Reset the state to show login form
          logout();
        }}
      />
    );
  }

  if (isAuthenticated && user) {
    // Extract a friendly username from email or use the username
    const friendlyUsername =
      user.email && user.email.includes("@")
        ? user.email.split("@")[0]
        : user.username;

    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome, {friendlyUsername}!</h1>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
        <div className="dashboard-content">
          <p>You are successfully authenticated with AWS Cognito.</p>
          <p>Email: {user.email}</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
};

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
