import { useState } from 'react';
import { 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon
} from '@ionic/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { save, close } from 'ionicons/icons';

interface MedicationFormProps {
  onSuccess: () => void;
  editData?: {
    id: string;
    medication_name: string;
    time: string;
    iteration: string;
    dosage: number;
  } | null;
  onCancel?: () => void;
}

export const IonicMedicationForm = ({ onSuccess, editData, onCancel }: MedicationFormProps) => {
  const [medicationName, setMedicationName] = useState(editData?.medication_name || '');
  const [time, setTime] = useState(editData?.time || '');
  const [iteration, setIteration] = useState(editData?.iteration || '');
  const [dosage, setDosage] = useState(editData?.dosage?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const medicationData = {
        medication_name: medicationName,
        time,
        iteration,
        dosage: parseInt(dosage),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      let error;
      if (editData) {
        const { error: updateError } = await supabase
          .from('medication_schedules')
          .update(medicationData)
          .eq('id', editData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('medication_schedules')
          .insert(medicationData);
        error = insertError;
      }

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(editData ? 'Medication updated successfully!' : 'Medication added successfully!');
        setMedicationName('');
        setTime('');
        setIteration('');
        setDosage('');
        onSuccess();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          {editData ? 'Edit Medication' : 'Add New Medication'}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <form onSubmit={handleSubmit}>
          <IonItem>
            <IonLabel position="stacked">Medication Name</IonLabel>
            <IonInput
              type="text"
              placeholder="Enter medication name"
              value={medicationName}
              onIonInput={(e) => setMedicationName(e.detail.value!)}
              required
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Time</IonLabel>
            <IonInput
              type="time"
              value={time}
              onIonInput={(e) => setTime(e.detail.value!)}
              required
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Frequency</IonLabel>
            <IonSelect 
              value={iteration} 
              onIonChange={(e) => setIteration(e.detail.value)}
              placeholder="Select frequency"
            >
              <IonSelectOption value="once">Once daily</IonSelectOption>
              <IonSelectOption value="twice">Twice daily</IonSelectOption>
              <IonSelectOption value="thrice">Three times daily</IonSelectOption>
            </IonSelect>
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Dosage (mg)</IonLabel>
            <IonInput
              type="number"
              placeholder="Enter dosage in mg"
              value={dosage}
              onIonInput={(e) => setDosage(e.detail.value!)}
              min="1"
              required
            />
          </IonItem>
          
          <div className="ion-padding-top">
            <IonButton 
              expand="block" 
              type="submit" 
              disabled={loading}
            >
              <IonIcon icon={save} slot="start" />
              {loading ? 'Saving...' : (editData ? 'Update' : 'Add Medication')}
            </IonButton>
            
            {onCancel && (
              <IonButton 
                expand="block" 
                fill="outline" 
                onClick={onCancel}
                className="ion-margin-top"
              >
                <IonIcon icon={close} slot="start" />
                Cancel
              </IonButton>
            )}
          </div>
        </form>
      </IonCardContent>
    </IonCard>
  );
};