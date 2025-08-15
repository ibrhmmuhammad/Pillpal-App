import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const MedicationForm = ({ onSuccess, editData, onCancel }: MedicationFormProps) => {
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {editData ? 'Edit Medication' : 'Add New Medication'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicationName">Medication Name</Label>
            <Input
              id="medicationName"
              type="text"
              placeholder="Enter medication name"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="iteration">Frequency</Label>
            <Select value={iteration} onValueChange={setIteration} required>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Once daily</SelectItem>
                <SelectItem value="twice">Twice daily</SelectItem>
                <SelectItem value="thrice">Three times daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage (mg)</Label>
            <Input
              id="dosage"
              type="number"
              placeholder="Enter dosage in mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              min="1"
              required
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : (editData ? 'Update' : 'Add Medication')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};