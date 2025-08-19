import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MedicationHistory from "./pages/MedicationHistory";

setupIonicReact();

const queryClient = new QueryClient();

const App = () => (
  <IonApp>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/" component={Index} />
            <Route path="/history" component={MedicationHistory} />
            <Route component={NotFound} />
          </IonRouterOutlet>
        </IonReactRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </IonApp>
);

export default App;
