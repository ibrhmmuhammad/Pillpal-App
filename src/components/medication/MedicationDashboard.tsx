import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicationForm } from './MedicationForm';
import { MedicationList } from './MedicationList';
import { MedicationTaken } from './MedicationTaken';
import { FloatingAIButton } from '@/components/ai/FloatingAIButton';
import { useAuth } from '@/hooks/useAuth';
import { Plus, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface Medication {
  id: string;
  medication_name: string;
  time: string;
  iteration: string;
  dosage: number;
}

export const MedicationDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Medication | null>(null);
  const [refreshList, setRefreshList] = useState(false);
  const [refreshTaken, setRefreshTaken] = useState(false);
  const { signOut } = useAuth();

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditData(null);
    setRefreshList(!refreshList);
  };

  const handleRefreshTaken = () => {
    setRefreshTaken(!refreshTaken);
  };

  const handleEdit = (medication: Medication) => {
    setEditData(medication);
    setShowForm(true);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">PillPal Pro</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Medication Tracker</h2>
            <p className="text-muted-foreground">Manage your daily medication schedule</p>
          </div>
          
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          )}
        </div>

        {showForm ? (
          <MedicationForm 
            onSuccess={handleFormSuccess}
            editData={editData}
            onCancel={handleCancel}
          />
        ) : (
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="taken">Taken</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule" className="mt-6">
              <MedicationList 
                onEdit={handleEdit}
                refresh={refreshList}
                onRefreshTaken={handleRefreshTaken}
              />
            </TabsContent>
            
            <TabsContent value="taken" className="mt-6">
              <MedicationTaken refresh={refreshTaken} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      <FloatingAIButton />
    </div>
  );
};