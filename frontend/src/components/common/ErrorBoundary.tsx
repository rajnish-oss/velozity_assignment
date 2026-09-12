import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-6 py-10 text-center">
            <h3 className="text-sm font-semibold text-rose-700">Something went wrong loading this view.</h3>
            <p className="text-sm text-rose-600">Try refreshing the page. If the problem continues, contact support.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-rose-700 shadow-sm ring-1 ring-rose-300 hover:bg-rose-50"
            >
              Try again
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}

// @ts-nocheck
