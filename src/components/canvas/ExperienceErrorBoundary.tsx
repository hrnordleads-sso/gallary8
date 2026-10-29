"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { setBrainLoadError } from "@/lib/brainLoadStore";

type Props = {
  children: ReactNode;
  reloadToken: number;
};

type State = {
  hasError: boolean;
};

/**
 * B4 · catch Canvas / R3F render failures so the page never stays a silent black void.
 */
export class ExperienceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ExperienceErrorBoundary]", error, info);
    setBrainLoadError(
      error.message || "WebGL scene failed to initialize on this device."
    );
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.reloadToken !== this.props.reloadToken && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
