import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AuthIntegration } from "../../utils/authIntegration";
import { apiService } from "../../services/apiService";

const TokenDemo: React.FC = () => {
  const { user, tokens } = useAuth();
  const [testUrl, setTestUrl] = useState("https://httpbin.org/headers");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const showAuthHeaders = () => {
    const headers = AuthIntegration.getAuthHeaders();
    setResponse(JSON.stringify(headers, null, 2));
  };

  const showTokens = () => {
    const tokens = AuthIntegration.getTokensForManualUse();
    setResponse(JSON.stringify(tokens, null, 2));
  };

  const testAuthenticatedRequest = async () => {
    if (!testUrl) return;

    setLoading(true);
    try {
      const result = await apiService.get(testUrl);
      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      setResponse(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testManualFetch = async () => {
    if (!testUrl) return;

    setLoading(true);
    try {
      const authenticatedFetch = AuthIntegration.createAuthenticatedFetch();
      const response = await authenticatedFetch(testUrl);
      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user || !tokens) {
    return (
      <div className="token-demo">
        <h3>Authentication Token Demo</h3>
        <p>Please log in to see authentication tokens and headers.</p>
      </div>
    );
  }

  return (
    <div className="token-demo">
      <h3>Authentication Token Demo</h3>

      <div className="demo-section">
        <h4>Current User</h4>
        <p>
          <strong>Username:</strong> {user.username}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
      </div>

      <div className="demo-section">
        <h4>Authentication Headers</h4>
        <p>These headers will be automatically included in API requests:</p>
        <button onClick={showAuthHeaders}>Show Auth Headers</button>
      </div>

      <div className="demo-section">
        <h4>Current Tokens</h4>
        <p>Raw tokens for manual use in other projects:</p>
        <button onClick={showTokens}>Show Tokens</button>
      </div>

      <div className="demo-section">
        <h4>Test Authenticated Request</h4>
        <p>Test how headers are sent to a backend API:</p>
        <div className="input-group">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter API URL to test"
            style={{ width: "300px", marginRight: "10px" }}
          />
          <button onClick={testAuthenticatedRequest} disabled={loading}>
            {loading ? "Testing..." : "Test API Service"}
          </button>
          <button onClick={testManualFetch} disabled={loading}>
            {loading ? "Testing..." : "Test Manual Fetch"}
          </button>
        </div>
      </div>

      <div className="demo-section">
        <h4>Response</h4>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "10px",
            borderRadius: "4px",
            maxHeight: "400px",
            overflow: "auto",
          }}
        >
          {response || "Click a button above to see the response..."}
        </pre>
      </div>

      <div className="demo-section">
        <h4>Integration Guide</h4>
        <p>To use this authentication in other projects:</p>
        <ol>
          <li>Import the AuthIntegration utility</li>
          <li>
            Use <code>AuthIntegration.getAuthHeaders()</code> to get headers
          </li>
          <li>
            Use <code>AuthIntegration.createAuthenticatedFetch()</code> for
            fetch requests
          </li>
          <li>
            Use <code>apiService.get/post/put/delete()</code> for direct API
            calls
          </li>
        </ol>
      </div>
    </div>
  );
};

export default TokenDemo;
