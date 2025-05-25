'use client'

import { useEffect } from "react"
import { sdk } from "@farcaster/frame-sdk"

export function FarcasterInit() {
  useEffect(() => {
    // Hide splash screen when app is ready
    sdk.actions.ready();
  }, []);
  
  return null;
} 