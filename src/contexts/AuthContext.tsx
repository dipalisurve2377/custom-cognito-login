import React, { createContext, useContext, useState, useEffect } from "react";
import type {
  User,
  AuthTokens,
  AuthState,
  LoginCredentials,
  AuthResponse,
} from "../types/auth";

// Action types
