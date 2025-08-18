import { useState, useEffect } from 'react';
import { 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonAlert
} from '@ionic/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { create, trash, time, medical, checkmark } from 'ionicons/icons';

interface Medication {
  id: string;
  medication_name: string;
  time: string;
  iteration: string;
  dosage: number;
  created_at: string;
}

interface MedicationListProps {
  onEdit: (medication: Medication) => void;
  refresh: boolean;
  onRefreshTaken?: () => void;
}

export const IonicMedicationList = ({ onEdit, refresh, onRefreshTaken }: MedicationListProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string>('');

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_schedules')
        .select('*')
        .order('time', { ascending: true });

      if (error) {
        toast.error('Failed to fetch medications');
      } else {
        setMedications(data || []);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    setSelectedMedId(id);
    setShowAlert(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('medication_schedules')
        .delete()
        .eq('id', selectedMedId);

      if (error) {
        toast.error('Failed to delete medication');
      } else {
        toast.success('Medication deleted successfully');
        fetchMedications();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
    setShowAlert(false);
    setSelectedMedId('');
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleMarkAsTaken = async (medication: Medication) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase
        .from('medication_taken')
        .insert({
          medication_schedule_id: medication.id,
          user_id: user.id,
          taken_at: new Date().toISOString()
        });

      if (error) {
        toast.error('Failed to mark medication as taken');
      } else {
        toast.success('Medication marked as taken!');
        onRefreshTaken?.();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const getIterationLabel = (iteration: string) => {
    switch (iteration) {
      case 'once': return 'Once daily';
      case 'twice': return 'Twice daily';
      case 'thrice': return 'Three times daily';
      default: return iteration;
    }
  };

  if (loading) {
    return (
      <IonCard>
        <IonCardContent className="text-center">
          Loading medications...
        </IonCardContent>
      </IonCard>
    );
  }

  if (medications.length === 0) {
    return (
      <IonCard>
        <IonCardContent className="text-center ion-padding">
          <IonIcon icon={medical} size="large" className="ion-margin-bottom" />
          <h3>No medications yet</h3>
          <p>Add your first medication to get started!</p>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <>
      {medications.map((medication) => (
        <IonCard key={medication.id}>
          <IonCardHeader>
            <IonCardTitle>{medication.medication_name}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="ion-margin-bottom">
              <div className="flex items-center ion-margin-bottom">
                <IonIcon icon={time} className="ion-margin-end" />
                <span>{formatTime(medication.time)}</span>
              </div>
              <div className="flex items-center ion-margin-bottom">
                <IonBadge color="secondary">
                  {getIterationLabel(medication.iteration)}
                </IonBadge>
              </div>
              <div className="flex items-center">
                <IonIcon icon={medical} className="ion-margin-end" />
                <span>{medication.dosage}mg</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <IonButton 
                size="small" 
                onClick={() => handleMarkAsTaken(medication)}
                color="success"
              >
                <IonIcon icon={checkmark} slot="start" />
                Taken
              </IonButton>
              <IonButton 
                size="small" 
                fill="outline" 
                onClick={() => onEdit(medication)}
              >
                <IonIcon icon={create} slot="start" />
                Edit
              </IonButton>
              <IonButton 
                size="small" 
                fill="outline" 
                color="danger"
                onClick={() => handleDelete(medication.id)}
              >
                <IonIcon icon={trash} slot="start" />
                Delete
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      ))}
      
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Confirm Delete"
        message="Are you sure you want to delete this medication?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setShowAlert(false)
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: confirmDelete
          }
        ]}
      />
    </>
  );
};