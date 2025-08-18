import { useState } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonFab,
  IonFabButton
} from '@ionic/react';
import { IonicMedicationForm } from './IonicMedicationForm';
import { IonicMedicationList } from './IonicMedicationList';
import { MedicationTaken } from './MedicationTaken';
import { FloatingAIButton } from '@/components/ai/FloatingAIButton';
import { useAuth } from '@/hooks/useAuth';
import { add, logOut } from 'ionicons/icons';
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
  const [selectedSegment, setSelectedSegment] = useState('schedule');
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
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>PillPal Pro</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="outline" onClick={handleSignOut}>
              <IonIcon icon={logOut} slot="start" />
              Sign Out
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Medication Tracker</h2>
              <p className="text-muted-foreground">Manage your daily medication schedule</p>
            </div>
          </div>

          {showForm ? (
            <IonicMedicationForm 
              onSuccess={handleFormSuccess}
              editData={editData}
              onCancel={handleCancel}
            />
          ) : (
            <>
              <IonSegment 
                value={selectedSegment} 
                onIonChange={e => setSelectedSegment(e.detail.value as string)}
              >
                <IonSegmentButton value="schedule">
                  <IonLabel>Schedule</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="taken">
                  <IonLabel>Taken</IonLabel>
                </IonSegmentButton>
              </IonSegment>
              
              {selectedSegment === 'schedule' && (
                <IonicMedicationList 
                  onEdit={handleEdit}
                  refresh={refreshList}
                  onRefreshTaken={handleRefreshTaken}
                />
              )}
              
              {selectedSegment === 'taken' && (
                <MedicationTaken refresh={refreshTaken} />
              )}
            </>
          )}
        </div>
        
        {!showForm && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => setShowForm(true)}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}
        
        <FloatingAIButton />
      </IonContent>
    </IonPage>
  );
};