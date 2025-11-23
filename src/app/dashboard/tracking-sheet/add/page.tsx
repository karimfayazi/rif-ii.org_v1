"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft as PrevIcon,
  Plus
} from "lucide-react";
import OutputManagementModal from "@/components/OutputManagementModal";

const UNIT_NAME_OPTIONS = [
  "Anaerobic Baffled Reactor",
  "Anaerobic Filter",
  "Analysis Report",
  "Assessment",
  "Bank Account",
  "Comitee",
  "Contract",
  "Dewat System",
  "Data Collection",
  "Design Document",
  "Detailed Design",
  "Discharge Outlet Structure",
  "Document",
  "Drilling",
  "Esia Report",
  "Fencing",
  "Field Visit",
  "Land",
  "Mis",
  "Map",
  "Master Plan",
  "Measures(Tubewell)",
  "Notfication Period",
  "On Job Training",
  "Pipe Line",
  "Project",
  "Pump House",
  "Pump/Machinery",
  "Report",
  "Scheme",
  "Sludge Drying Bed",
  "Solar Yestem",
  "Storm Water Overflow Structure",
  "Study Report",
  "Survey",
  "Survey Report",
  "Team Members",
  "Tender Document",
  "Tool",
  "Training",
  "Tubewell",
  "Valve Chamber",
  "Visit",
  "Water Supply Scheme",
  "Workshop",
  "Confirmation Report",
  "Drains",
  "Interventions",
  "Monitoring",
  "Study",
  "Treatment Plant"
];

type TrackingData = {
  id?: number;
  OutputID: string | number;
  Output: string;
  MainActivityName: string;
  ActivityID: number | string;
  SubActivityName: string;
  Sub_Sub_ActivityID_ID?: number;
  Sub_Sub_ActivityName: string;
  UnitName: string;
  PlannedTargets: number;
  AchievedTargets: number;
  ActivityProgress: number;
  ActivityWeightage: number;
  ActivityWeightageProgress?: number;
  PlannedStartDate: string;
  PlannedEndDate: string;
  Remarks: string;
  Links: string;
  Sector_Name: string;
  District: string;
  Tehsil: string;
  Beneficiaries_Male: number;
  Beneficiaries_Female: number;
  Total_Beneficiaries: number;
  Beneficiary_Types: string;
  SubActivityID: number | string;
  Sub_Sub_ActivityID: number | string;
};

export default function AddTrackingRecordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<TrackingData>({
    OutputID: "",
    Output: "",
    MainActivityName: "",
    ActivityID: 0,
    SubActivityName: "",
    Sub_Sub_ActivityName: "",
    UnitName: "",
    PlannedTargets: 0,
    AchievedTargets: 0,
    ActivityProgress: 0,
    ActivityWeightage: 0,
    PlannedStartDate: "",
    PlannedEndDate: "",
    Remarks: "",
    Links: "",
    Sector_Name: "",
    District: "",
    Tehsil: "",
    Beneficiaries_Male: 0,
    Beneficiaries_Female: 0,
    Total_Beneficiaries: 0,
    Beneficiary_Types: "",
    SubActivityID: 0,
    Sub_Sub_ActivityID: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [outputs, setOutputs] = useState<Array<{OutputID: string, Output: string}>>([]);
  const [loadingOutputs, setLoadingOutputs] = useState(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [mainActivities, setMainActivities] = useState<Array<{ActivityID: number, MainActivityName: string, OutputID: string}>>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityIDs, setActivityIDs] = useState<Array<{ActivityID: number | string, MainActivityName: string, OutputID: string}>>([]);
  const [loadingActivityIDs, setLoadingActivityIDs] = useState(false);
  const [subActivities, setSubActivities] = useState<Array<{SubActivityID: number | string, ActivityID: number, SubActivityName: string}>>([]);
  const [loadingSubActivities, setLoadingSubActivities] = useState(false);
  const [tehsils, setTehsils] = useState<string[]>([]);
  const [loadingTehsils, setLoadingTehsils] = useState(false);
  const [unitSearchTerm, setUnitSearchTerm] = useState("");

  // Keep MainActivityName in sync when ActivityID or activity list changes
  useEffect(() => {
    if (formData.ActivityID && formData.ActivityID !== 0 && activityIDs.length > 0) {
      const selectedActivity = activityIDs.find(a => {
        // Handle both number and string comparisons for decimal ActivityIDs
        return String(a.ActivityID) === String(formData.ActivityID) || 
               (typeof a.ActivityID === 'number' && typeof formData.ActivityID === 'number' && a.ActivityID === formData.ActivityID);
      });
      if (selectedActivity && selectedActivity.MainActivityName !== formData.MainActivityName) {
        setFormData(prev => ({
          ...prev,
          MainActivityName: selectedActivity.MainActivityName || ""
        }));
      }
    }
  }, [formData.ActivityID, activityIDs]);

  useEffect(() => {
    fetchOutputs();
  }, []);

  // Fetch outputs from database
  const fetchOutputs = async () => {
    try {
      setLoadingOutputs(true);
      const response = await fetch('/api/tracking-sheet/outputs');
      const data = await response.json();
      
      if (data.success) {
        setOutputs(data.outputs || []);
      } else {
        console.error('Failed to fetch outputs:', data.message);
      }
    } catch (error) {
      console.error('Error fetching outputs:', error);
    } finally {
      setLoadingOutputs(false);
    }
  };

  const filteredUnitOptions = useMemo(() => {
    if (!unitSearchTerm.trim()) return UNIT_NAME_OPTIONS;
    return UNIT_NAME_OPTIONS.filter(unit =>
      unit.toLowerCase().includes(unitSearchTerm.toLowerCase())
    );
  }, [unitSearchTerm]);

  // Handle outputs change from modal
  const handleOutputsChange = () => {
    fetchOutputs();
  };

  // Fetch main activities based on selected OutputID
  const fetchMainActivities = async (outputID: string) => {
    if (!outputID) {
      setMainActivities([]);
      setActivityIDs([]);
      return;
    }

    try {
      setLoadingActivities(true);
      setLoadingActivityIDs(true);
      const response = await fetch(`/api/tracking-sheet/main-activities?outputID=${encodeURIComponent(outputID)}`);
      const data = await response.json();
      
      if (data.success) {
        setMainActivities(data.activities || []);
        setActivityIDs(data.activities || []); // Same data for both dropdowns
      } else {
        console.error('Failed to fetch main activities:', data.message);
        setMainActivities([]);
        setActivityIDs([]);
      }
    } catch (error) {
      console.error('Error fetching main activities:', error);
      setMainActivities([]);
      setActivityIDs([]);
    } finally {
      setLoadingActivities(false);
      setLoadingActivityIDs(false);
    }
  };

  // Fetch sub activities by ActivityID
  const fetchSubActivities = async (activityID: number) => {
    if (!activityID) {
      setSubActivities([]);
      return;
    }
    try {
      setLoadingSubActivities(true);
      const res = await fetch(`/api/tracking-sheet/sub-activities?ActivityID=${encodeURIComponent(activityID)}`);
      const data = await res.json();
      if (data.success) setSubActivities(data.subActivities || []);
      else setSubActivities([]);
    } catch (e) {
      setSubActivities([]);
    } finally {
      setLoadingSubActivities(false);
    }
  };

  // Fetch tehsils by district
  const fetchTehsils = async (district: string) => {
    if (!district || district === 'ALL') {
      setTehsils(['ALL']);
      return;
    }
    try {
      setLoadingTehsils(true);
      const res = await fetch(`/api/tracking-sheet/tehsils?district=${encodeURIComponent(district)}`);
      const data = await res.json();
      if (data.success) {
        const tehsilList = data.tehsils || [];
        setTehsils(['ALL', ...tehsilList]);
      } else {
        setTehsils(['ALL']);
      }
    } catch (e) {
      setTehsils(['ALL']);
    } finally {
      setLoadingTehsils(false);
    }
  };

  // Validation function
  const validateForm = (step?: number) => {
    const errors: Record<string, string> = {};
    
    if (!step || step === 1) {
      if (!formData.OutputID || formData.OutputID === "" || formData.OutputID === 0) {
        errors.OutputID = "Output ID is required";
      }
      // Handle both number and string ActivityIDs (e.g., 1, 1.1, "1.1")
      const activityIdIsValid = formData.ActivityID && 
        formData.ActivityID !== 0 && 
        formData.ActivityID !== "0" && 
        formData.ActivityID !== "";
      if (!activityIdIsValid) {
        errors.ActivityID = "Activity ID is required";
      }
      if (!formData.MainActivityName || !formData.MainActivityName.trim()) {
        errors.MainActivityName = "Main Activity Name is required";
      }
      // Handle both number and string SubActivityIDs (e.g., 1, 1.1, "1.1.1")
      const subActivityIdIsValid = formData.SubActivityID && 
        formData.SubActivityID !== 0 && 
        formData.SubActivityID !== "0" && 
        formData.SubActivityID !== "";
      if (!subActivityIdIsValid) {
        errors.SubActivityID = "Sub Activity ID is required";
      }
      if (!formData.SubActivityName || !formData.SubActivityName.trim()) {
        errors.SubActivityName = "Sub Activity Name is required";
      }
      // Validate Sub-Sub Activity ID and Name (required for Tracking_Sheet_Sub_Sub_Activity table)
      const subSubActivityIdIsValid = formData.Sub_Sub_ActivityID && 
        formData.Sub_Sub_ActivityID !== 0 && 
        formData.Sub_Sub_ActivityID !== "0" && 
        formData.Sub_Sub_ActivityID !== "";
      if (!subSubActivityIdIsValid) {
        errors.Sub_Sub_ActivityID = "Sub-Sub Activity ID is required";
      }
      if (!formData.Sub_Sub_ActivityName || !formData.Sub_Sub_ActivityName.trim()) {
        errors.Sub_Sub_ActivityName = "Sub-Sub Activity Name is required";
      }
    }
    
    if (!step || step === 2) {
      if (formData.PlannedTargets < 0) {
        errors.PlannedTargets = "Planned Targets cannot be negative";
      }
      if (formData.AchievedTargets < 0) {
        errors.AchievedTargets = "Achieved Targets cannot be negative";
      }
      if (formData.ActivityProgress < 0 || formData.ActivityProgress > 100) {
        errors.ActivityProgress = "Activity Progress must be between 0 and 100";
      }
      if (formData.ActivityWeightage < 0 || formData.ActivityWeightage > 100) {
        errors.ActivityWeightage = "Activity Weightage must be between 0 and 100";
      }
    }
    
    if (!step || step === 3) {
      if (formData.Beneficiaries_Male < 0) {
        errors.Beneficiaries_Male = "Male beneficiaries cannot be negative";
      }
      if (formData.Beneficiaries_Female < 0) {
        errors.Beneficiaries_Female = "Female beneficiaries cannot be negative";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step navigation
  const nextStep = () => {
    if (validateForm(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle Output ID selection - auto-populate Output field and fetch main activities
    if (name === 'OutputID') {
      const selectedOutput = outputs.find(output => output.OutputID === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        Output: selectedOutput ? selectedOutput.Output : "",
        MainActivityName: "", // Reset main activity when output changes
        ActivityID: 0, // Reset activity id
        SubActivityID: 0,
        SubActivityName: "",
        Sub_Sub_ActivityID: "",
        Sub_Sub_ActivityName: ""
      }));
      
      // Fetch main activities for the selected output
      fetchMainActivities(value);
    } 
    // Handle District selection - fetch tehsils
    else if (name === 'District') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        Tehsil: value === 'ALL' ? 'ALL' : ''
      }));
      fetchTehsils(value);
    }
    // Handle ActivityID selection - set MainActivityName
    else if (name === 'ActivityID') {
      // Handle both integer and decimal ActivityIDs (e.g., 1, 1.1, 1.2)
      const activityIdValue = value === "0" ? 0 : (isNaN(Number(value)) ? value : Number(value));
      // Only process if a valid activity ID is selected (not 0)
      if (value !== "0" && value !== "") {
        // Find activity by comparing both as numbers and as strings to handle decimals
        const selectedActivity = activityIDs.find(activity => {
          const activityId = activity.ActivityID;
          // Compare as numbers if both are numeric, otherwise as strings
          if (typeof activityId === 'number' && typeof activityIdValue === 'number') {
            return activityId === activityIdValue;
          }
          return String(activityId) === String(value);
        });
        setFormData(prev => ({
          ...prev,
          [name]: activityIdValue,
          MainActivityName: selectedActivity ? selectedActivity.MainActivityName : "",
          SubActivityID: 0,
          SubActivityName: "",
          Sub_Sub_ActivityID: "",
          Sub_Sub_ActivityName: ""
        }));
        // Load sub activities for selected activity - convert to number for API
        const numericId = typeof activityIdValue === 'number' ? activityIdValue : parseFloat(String(activityIdValue));
        if (!isNaN(numericId)) {
          fetchSubActivities(numericId);
        }
      } else {
        // Reset if "0" (default) is selected
        setFormData(prev => ({
          ...prev,
          [name]: 0,
          MainActivityName: "",
          SubActivityID: 0,
          SubActivityName: "",
          Sub_Sub_ActivityID: "",
          Sub_Sub_ActivityName: ""
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
      }));
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Calculate total beneficiaries
      const totalBeneficiaries = formData.Beneficiaries_Male + formData.Beneficiaries_Female;
      
      // Transform data to match API expected format (camelCase)
      const dataToSave = {
        outputID: formData.OutputID,
        output: formData.Output,
        mainActivityName: formData.MainActivityName,
        subActivityName: formData.SubActivityName,
        subSubActivityName: formData.Sub_Sub_ActivityName,
        unitName: formData.UnitName,
        plannedTargets: formData.PlannedTargets,
        achievedTargets: formData.AchievedTargets,
        activityProgress: formData.ActivityProgress,
        activityWeightage: formData.ActivityWeightage,
        plannedStartDate: formData.PlannedStartDate,
        plannedEndDate: formData.PlannedEndDate,
        remarks: formData.Remarks,
        links: formData.Links,
        sectorName: formData.Sector_Name,
        district: formData.District,
        tehsil: formData.Tehsil,
        beneficiariesMale: formData.Beneficiaries_Male,
        beneficiariesFemale: formData.Beneficiaries_Female,
        totalBeneficiaries: totalBeneficiaries,
        beneficiaryTypes: formData.Beneficiary_Types,
        subActivityID: formData.SubActivityID,
        activityID: formData.ActivityID,
        subSubActivityID: formData.Sub_Sub_ActivityID
      };

      const response = await fetch('/api/tracking-sheet/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Redirect to tracking sheet page after a short delay
        setTimeout(() => {
          router.push('/dashboard/tracking-sheet');
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to save record');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Get step title
  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Basic Information";
      case 2: return "Targets & Progress";
      case 3: return "Location & Beneficiaries";
      case 4: return "Additional Information";
      default: return "";
    }
  };

  // Get step description
  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return "Enter the basic activity information and identifiers";
      case 2: return "Set targets, progress, and timeline information";
      case 3: return "Specify location details and beneficiary information";
      case 4: return "Add any additional notes, links, or remarks";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Add New Tracking Record</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {getStepTitle(currentStep)} - Step {currentStep} of {totalSteps}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i + 1 <= currentStep 
                    ? 'bg-[#0b4d2b] text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-12 h-1 mx-2 ${
                    i + 1 < currentStep ? 'bg-[#0b4d2b]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            {getStepDescription(currentStep)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center mb-6">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700 font-medium">
              Record added successfully! Redirecting to tracking sheet...
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Output ID *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsOutputModalOpen(true)}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-[#0b4d2b] bg-[#0b4d2b]/10 rounded-lg hover:bg-[#0b4d2b]/20 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Manage
                      </button>
                    </div>
                    <select
                      name="OutputID"
                      value={formData.OutputID}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                        validationErrors.OutputID ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      disabled={loadingOutputs}
                    >
                      <option value="">
                        {loadingOutputs ? 'Loading outputs...' : 'Select Output ID'}
                      </option>
                      {outputs.map((output) => (
                        <option key={output.OutputID} value={output.OutputID}>
                          {output.OutputID}
                        </option>
                      ))}
                    </select>
                    {validationErrors.OutputID && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.OutputID}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Output Description
                    </label>
                    <textarea
                      name="Output"
                      value={formData.Output}
                      readOnly
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 resize-none"
                      placeholder="Output description will appear here when you select an Output ID"
                    />
                    <p className="mt-1 text-xs text-gray-500">This field is automatically populated when you select an Output ID</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Activity ID *
                      </label>
                      <a
                        href="/dashboard/tracking-sheet/main-activities/manage"
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-[#0b4d2b] bg-[#0b4d2b]/10 rounded-lg hover:bg-[#0b4d2b]/20 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        +Manage
                      </a>
                    </div>
                    <select
                      name="ActivityID"
                      value={formData.ActivityID && formData.ActivityID !== 0 && formData.ActivityID !== "0" ? String(formData.ActivityID) : "0"}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                        validationErrors.ActivityID ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } ${loadingActivityIDs || !formData.OutputID ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
                      disabled={loadingActivityIDs || !formData.OutputID}
                    >
                      <option value="0">
                        {loadingActivityIDs ? 'Loading activity IDs...' : 
                         !formData.OutputID ? 'Please select an Output ID first' : 
                         'Select Activity ID'}
                      </option>
                      {activityIDs.length > 0 && activityIDs.map((activity) => (
                        <option key={String(activity.ActivityID)} value={String(activity.ActivityID)}>
                          {activity.ActivityID}
                        </option>
                      ))}
                    </select>
                    {validationErrors.ActivityID && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.ActivityID}</p>
                    )}
                    {formData.OutputID && activityIDs.length === 0 && !loadingActivityIDs && (
                      <p className="mt-1 text-sm text-gray-500">No activity IDs found for this output</p>
                    )}
                    {formData.OutputID && activityIDs.length > 0 && !loadingActivityIDs && (
                      <p className="mt-1 text-xs text-gray-500">
                        {activityIDs.length} activity ID{activityIDs.length !== 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Activity Name *
                    </label>
                    <textarea
                      name="MainActivityName"
                      value={formData.MainActivityName}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 resize-none"
                      placeholder="Main activity name will appear here when you select an Activity ID"
                      readOnly
                    />
                    {validationErrors.MainActivityName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.MainActivityName}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">This field is automatically populated when you select an Activity ID</p>
                  </div>

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Sub Activity id</label>
                          <a
                            href="/dashboard/tracking-sheet/sub-activities/manage"
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-[#0b4d2b] bg-[#0b4d2b]/10 rounded-lg hover:bg-[#0b4d2b]/20 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            +Manage
                          </a>
                        </div>
                        <select
                          name="SubActivityID"
                          value={formData.SubActivityID && formData.SubActivityID !== 0 && formData.SubActivityID !== "0" ? String(formData.SubActivityID) : "0"}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Handle both integer and decimal SubActivityIDs (e.g., 1, 1.1, 1.1.1)
                            const subId = value === "0" ? 0 : (isNaN(Number(value)) ? value : Number(value));
                            
                            if (value !== "0" && value !== "") {
                              // Find sub activity by comparing both as numbers and as strings to handle decimals
                              const selected = subActivities.find(s => {
                                const subActivityId = s.SubActivityID;
                                // Compare as numbers if both are numeric, otherwise as strings
                                if (typeof subActivityId === 'number' && typeof subId === 'number') {
                                  return subActivityId === subId;
                                }
                                return String(subActivityId) === String(value);
                              });
                              
                              setFormData(prev => ({
                                ...prev,
                                SubActivityID: subId,
                                SubActivityName: selected ? selected.SubActivityName : ""
                              }));
                            } else {
                              // Reset if "0" (default) is selected
                              setFormData(prev => ({
                                ...prev,
                                SubActivityID: 0,
                                SubActivityName: "",
                                Sub_Sub_ActivityID: "",
                                Sub_Sub_ActivityName: ""
                              }));
                            }
                            
                            if (validationErrors.SubActivityName) {
                              setValidationErrors(prev => { const n = { ...prev }; delete n.SubActivityName; return n; });
                            }
                          }}
                          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                          disabled={!formData.ActivityID || loadingSubActivities}
                        >
                          <option value="0">{!formData.ActivityID ? 'Select Activity ID first' : (loadingSubActivities ? 'Loading...' : 'Select Sub Activity ID')}</option>
                          {subActivities.map(sa => (
                            <option key={String(sa.SubActivityID)} value={String(sa.SubActivityID)}>{sa.SubActivityID}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sub Activity Name *</label>
                        <textarea
                          name="SubActivityName"
                          value={formData.SubActivityName}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 resize-none"
                          placeholder="Sub Activity Name"
                          readOnly
                        />
                      </div>
                    </div>
                    {validationErrors.SubActivityName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.SubActivityName}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sub-Sub Activity ID *
                        </label>
                        <input
                          type="text"
                          name="Sub_Sub_ActivityID"
                          value={formData.Sub_Sub_ActivityID || ""}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                            validationErrors.Sub_Sub_ActivityID ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Enter Sub-Sub Activity ID (e.g., 1.1.1)"
                        />
                        {validationErrors.Sub_Sub_ActivityID && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.Sub_Sub_ActivityID}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sub-Sub Activity Name *
                        </label>
                        <input
                          type="text"
                          name="Sub_Sub_ActivityName"
                          value={formData.Sub_Sub_ActivityName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                            validationErrors.Sub_Sub_ActivityName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Enter Sub-Sub Activity Name"
                        />
                        {validationErrors.Sub_Sub_ActivityName && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.Sub_Sub_ActivityName}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Name
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={unitSearchTerm}
                        onChange={(e) => setUnitSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                        placeholder="Search unit names..."
                      />
                      <select
                        name="UnitName"
                        value={formData.UnitName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors bg-white"
                      >
                        <option value="">Select Unit Name</option>
                        {filteredUnitOptions.length === 0 ? (
                          <option value="" disabled>No matches found</option>
                        ) : (
                          filteredUnitOptions.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))
                        )}
                      </select>
                      <p className="text-xs text-gray-500">
                        Start typing to filter unit names or select from the list.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Targets & Progress */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planned Targets
                    </label>
                    <input
                      type="number"
                      name="PlannedTargets"
                      value={formData.PlannedTargets}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                        validationErrors.PlannedTargets ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter Planned Targets"
                    />
                    {validationErrors.PlannedTargets && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.PlannedTargets}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Achieved Targets
                    </label>
                    <input
                      type="number"
                      name="AchievedTargets"
                      value={formData.AchievedTargets}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                        validationErrors.AchievedTargets ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter Achieved Targets"
                    />
                    {validationErrors.AchievedTargets && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.AchievedTargets}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Progress (%)
                    </label>
                    <input
                      type="number"
                      name="ActivityProgress"
                      value={formData.ActivityProgress}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                        validationErrors.ActivityProgress ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter Progress Percentage"
                    />
                    {validationErrors.ActivityProgress && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.ActivityProgress}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Weightage (%)
                    </label>
                    <input
                      type="number"
                      name="ActivityWeightage"
                      value={formData.ActivityWeightage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                        validationErrors.ActivityWeightage ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter Weightage Percentage"
                    />
                    {validationErrors.ActivityWeightage && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.ActivityWeightage}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planned Start Date
                    </label>
                    <input
                      type="date"
                      name="PlannedStartDate"
                      value={formData.PlannedStartDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planned End Date
                    </label>
                    <input
                      type="date"
                      name="PlannedEndDate"
                      value={formData.PlannedEndDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location & Beneficiaries */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sector Name
                    </label>
                    <input
                      type="text"
                      name="Sector_Name"
                      value={formData.Sector_Name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                      placeholder="Enter Sector Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <select
                      name="District"
                      value={formData.District}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                    >
                      <option value="">Select District</option>
                      <option value="ALL">ALL</option>
                      <option value="DIK">DIK</option>
                      <option value="Bannu">Bannu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tehsil
                    </label>
                    <select
                      name="Tehsil"
                      value={formData.Tehsil}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                      disabled={!formData.District || loadingTehsils}
                    >
                      <option value="">
                        {loadingTehsils ? 'Loading tehsils...' : 
                         !formData.District ? 'Please select a district first' : 
                         'Select Tehsil'}
                      </option>
                      {tehsils.map((tehsil) => (
                        <option key={tehsil} value={tehsil}>
                          {tehsil}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beneficiary Types
                    </label>
                    <input
                      type="text"
                      name="Beneficiary_Types"
                      value={formData.Beneficiary_Types}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                      placeholder="Enter Beneficiary Types"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Male Beneficiaries
                    </label>
                    <input
                      type="number"
                      name="Beneficiaries_Male"
                      value={formData.Beneficiaries_Male}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                        validationErrors.Beneficiaries_Male ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter Male Beneficiaries"
                    />
                    {validationErrors.Beneficiaries_Male && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.Beneficiaries_Male}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Female Beneficiaries
                    </label>
                    <input
                      type="number"
                      name="Beneficiaries_Female"
                      value={formData.Beneficiaries_Female}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors ${
                        validationErrors.Beneficiaries_Female ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter Female Beneficiaries"
                    />
                    {validationErrors.Beneficiaries_Female && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.Beneficiaries_Female}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Beneficiaries
                    </label>
                    <input
                      type="number"
                      value={formData.Beneficiaries_Male + formData.Beneficiaries_Female}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">Automatically calculated from male + female beneficiaries</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Additional Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="Remarks"
                    value={formData.Remarks}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors resize-none"
                    placeholder="Enter any additional remarks or notes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Links
                  </label>
                  <input
                    type="url"
                    name="Links"
                    value={formData.Links}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none transition-colors"
                    placeholder="Enter any relevant links (e.g., documents, reports)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <PrevIcon className="h-4 w-4 mr-2" />
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#0b4d2b] rounded-lg hover:bg-[#0a3d24] transition-colors"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Record...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Add Record
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Output Management Modal */}
      <OutputManagementModal
        isOpen={isOutputModalOpen}
        onClose={() => setIsOutputModalOpen(false)}
        onOutputsChange={handleOutputsChange}
      />
    </div>
  );
}
