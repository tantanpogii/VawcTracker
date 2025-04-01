import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Cases from "@/pages/cases";
import CaseDetail from "@/pages/case-detail";
import PrivateRoute from "@/components/layout/private-route";
import Navbar from "@/components/layout/navbar";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <PrivateRoute>
          <Navbar />
          <Dashboard />
        </PrivateRoute>
      </Route>
      <Route path="/cases">
        <PrivateRoute>
          <Navbar />
          <Cases />
        </PrivateRoute>
      </Route>
      <Route path="/cases/:id">
        {(params) => (
          <PrivateRoute>
            <Navbar />
            <CaseDetail id={parseInt(params.id)} />
          </PrivateRoute>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
