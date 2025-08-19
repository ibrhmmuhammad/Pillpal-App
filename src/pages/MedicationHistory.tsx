import { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonSearchbar,
  IonDatetime,
  IonPopover,
  IonButtons,
  IonBackButton,
  IonFab,
  IonFabButton
} from '@ionic/react';
import { shareOutline, downloadOutline, calendarOutline, arrowBack } from 'ionicons/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

interface MedicationRecord {
  id: string;
  medication_schedule_id: string;
  taken_at: string;
  notes?: string;
  medication_schedules: {
    medication_name: string;
    dosage: number;
    iteration: string;
  };
}

const MedicationHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMedicationHistory();
    }
  }, [user]);

  useEffect(() => {
    filterRecords();
  }, [records, searchText, startDate, endDate]);

  const fetchMedicationHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medication_taken')
        .select(`
          *,
          medication_schedules (
            medication_name,
            dosage,
            iteration
          )
        `)
        .eq('user_id', user?.id)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching medication history:', error);
      toast.error('Failed to load medication history');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (searchText) {
      filtered = filtered.filter(record =>
        record.medication_schedules.medication_name.toLowerCase().includes(searchText.toLowerCase()) ||
        record.notes?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(record => 
        new Date(record.taken_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(record => 
        new Date(record.taken_at) <= new Date(endDate)
      );
    }

    setFilteredRecords(filtered);
  };

  const generatePDF = async () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      // Create a temporary container for PDF content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.background = 'white';
      pdfContainer.style.padding = '40px';
      pdfContainer.style.width = '800px';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';

      // Create PDF content
      const currentDate = format(new Date(), 'MMMM dd, yyyy');
      const dateRange = startDate && endDate 
        ? `From ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}`
        : 'All time';

      pdfContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Medication History Report</h1>
          <p style="margin: 5px 0; font-size: 14px; color: #666;">Generated on ${currentDate}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #666;">${dateRange}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">Summary</h2>
          <p style="margin: 5px 0;">Total medications taken: <strong>${filteredRecords.length}</strong></p>
          <p style="margin: 5px 0;">Unique medications: <strong>${new Set(filteredRecords.map(r => r.medication_schedules.medication_name)).size}</strong></p>
        </div>

        <h2 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">Detailed Records</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold;">Date & Time</th>
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold;">Medication</th>
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold;">Dosage</th>
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecords.map(record => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 10px;">${format(new Date(record.taken_at), 'MMM dd, yyyy HH:mm')}</td>
                <td style="border: 1px solid #d1d5db; padding: 10px;">${record.medication_schedules.medication_name}</td>
                <td style="border: 1px solid #d1d5db; padding: 10px;">${record.medication_schedules.dosage} ${record.medication_schedules.iteration}</td>
                <td style="border: 1px solid #d1d5db; padding: 10px;">${record.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          <p>This report was generated from your medication tracking application.</p>
          <p>Please share this information only with authorized healthcare providers.</p>
        </div>
      `;

      document.body.appendChild(pdfContainer);

      // Convert to canvas and then PDF
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(pdfContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `medication-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const shareData = async () => {
    if (navigator.share && filteredRecords.length > 0) {
      try {
        await navigator.share({
          title: 'Medication History',
          text: `Medication history report with ${filteredRecords.length} records`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to PDF generation
        generatePDF();
      }
    } else {
      generatePDF();
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>Medication History</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex justify-center items-center h-32">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Medication History</IonTitle>
          <IonButtons slot="end">
            <IonButton 
              fill="clear" 
              onClick={shareData}
              disabled={isGeneratingPDF || filteredRecords.length === 0}
            >
              <IonIcon icon={shareOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search medications or notes..."
            className="mb-4"
          />

          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Filter by Date Range</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <IonLabel>Start Date</IonLabel>
                  <IonButton 
                    fill="outline" 
                    expand="block" 
                    id="start-date-trigger"
                    className="mt-2"
                  >
                    <IonIcon icon={calendarOutline} slot="start" />
                    {startDate ? format(new Date(startDate), 'MMM dd, yyyy') : 'Select Start'}
                  </IonButton>
                  <IonPopover trigger="start-date-trigger">
                    <IonDatetime
                      value={startDate}
                      onIonChange={(e) => setStartDate(e.detail.value as string)}
                      presentation="date"
                      max={new Date().toISOString()}
                    />
                  </IonPopover>
                </div>
                
                <div>
                  <IonLabel>End Date</IonLabel>
                  <IonButton 
                    fill="outline" 
                    expand="block" 
                    id="end-date-trigger"
                    className="mt-2"
                  >
                    <IonIcon icon={calendarOutline} slot="start" />
                    {endDate ? format(new Date(endDate), 'MMM dd, yyyy') : 'Select End'}
                  </IonButton>
                  <IonPopover trigger="end-date-trigger">
                    <IonDatetime
                      value={endDate}
                      onIonChange={(e) => setEndDate(e.detail.value as string)}
                      presentation="date"
                      max={new Date().toISOString()}
                      min={startDate}
                    />
                  </IonPopover>
                </div>
              </div>
              
              {(startDate || endDate) && (
                <IonButton 
                  fill="clear" 
                  size="small" 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="mt-3"
                >
                  Clear Filters
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex justify-between items-center">
                <span>Records ({filteredRecords.length})</span>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No medication records found</p>
                  {searchText || startDate || endDate ? (
                    <p className="text-sm mt-2">Try adjusting your filters</p>
                  ) : null}
                </div>
              ) : (
                <IonList>
                  {filteredRecords.map((record) => (
                    <IonItem key={record.id} lines="full">
                      <IonLabel>
                        <h2 className="font-semibold text-lg">
                          {record.medication_schedules.medication_name}
                        </h2>
                        <p className="text-gray-600">
                          {record.medication_schedules.dosage} {record.medication_schedules.iteration}
                        </p>
                        <p className="text-sm text-gray-500">
                          Taken: {format(new Date(record.taken_at), 'MMM dd, yyyy at HH:mm')}
                        </p>
                        {record.notes && (
                          <p className="text-sm text-blue-600 mt-1">
                            Note: {record.notes}
                          </p>
                        )}
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton 
            onClick={generatePDF}
            disabled={isGeneratingPDF || filteredRecords.length === 0}
          >
            <IonIcon icon={isGeneratingPDF ? undefined : downloadOutline} />
            {isGeneratingPDF && <IonSpinner />}
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default MedicationHistory;