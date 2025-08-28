import React, { useState } from 'react'
import { Building2, Upload, Globe, Phone, MapPin, User, FileText, Camera, Hash } from 'lucide-react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { CountryCodeDropdown } from './ui/country-code-dropdown'
import { supabase } from '../lib/supabase'

interface SignupData {
  name: string
  email: string
  password: string
  userType: 'job_seeker' | 'company'
}

interface CompanyProfileCompletionProps {
  signupData: SignupData
  onProfileComplete: () => void
}

export function CompanyProfileCompletion({ signupData, onProfileComplete }: CompanyProfileCompletionProps) {
  const [formData, setFormData] = useState({
    contactPersonName: signupData.name,
    email: signupData.email,
    companyLogo: null as File | null,
    companyLogoUrl: '',
    companyName: '',
    websiteLink: '',
    phoneNumber: '',
    industry: '',
    managerName: '',
    companyId: '',
    companyAddress: '',
    responsiblePerson: '',
    shortIntroduction: ''
  })
  
  const [countryCode, setCountryCode] = useState('+1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, companyLogo: file }))
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setFormData(prev => ({ ...prev, companyLogoUrl: previewUrl }))
    }
  }

  const uploadFile = async (file: File, folder: string): Promise<{ publicUrl: string; filePath: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `temp-${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath)

      return { publicUrl: data.publicUrl, filePath }
    } catch (error) {
      console.error('File upload error:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.name,
            user_type: signupData.userType,
          }
        }
      })

      if (authError) {
        throw new Error(`Account creation failed: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('Account creation failed: No user returned')
      }

      const newUser = authData.user

      let companyLogoUrl = ''
      
      // Upload company logo if provided
      if (formData.companyLogo) {
        const uploadResult = await uploadFile(formData.companyLogo, 'company-logos')
        if (uploadResult) {
          companyLogoUrl = uploadResult.publicUrl
          // Update the file path to include the actual user ID
          const fileExt = formData.companyLogo.name.split('.').pop()
          const newFileName = `${newUser.id}-${Date.now()}.${fileExt}`
          const newFilePath = `company-logos/${newFileName}`
          
          // Move the file to the correct path with user ID
          const { error: moveError } = await supabase.storage
            .from('user-files')
            .move(uploadResult.filePath, newFilePath)
          
          if (!moveError) {
            const { data } = supabase.storage
              .from('user-files')
              .getPublicUrl(newFilePath)
            companyLogoUrl = data.publicUrl
          }
        }
      }

      // Insert company profile
      const { error: companyError } = await supabase
        .from('companies')
        .insert({
          user_id: newUser.id,
          company_name: formData.companyName,
          company_logo: companyLogoUrl,
          industry: formData.industry,
          website_link: formData.websiteLink,
          mol_name: formData.managerName,
          uic_company_id: formData.companyId,
          address: formData.companyAddress,
          phone_number: formData.phoneNumber,
          contact_email: formData.email,
          responsible_person_name: formData.responsiblePerson,
          short_introduction: formData.shortIntroduction
        })

      if (companyError) {
        throw companyError
      }

      // Call completion callback
      onProfileComplete()
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your company profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img 
              src="/talent book singular icon.png" 
              alt="TalentBook Icon" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
            Complete Your Company Profile
          </h1>
          <p className="text-gray-300">
            Set up your company profile to start finding the perfect candidates
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6 font-poppins flex items-center">
              <User className="w-5 h-5 mr-3 text-[#FFC107]" />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Person Name */}
              <div>
                <Label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Person Name
                </Label>
                <input
                  type="text"
                  id="contactPersonName"
                  required
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPersonName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                  placeholder="Enter contact person name"
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </Label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="mt-6">
              <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                Company Telephone Number
              </Label>
              <div className="flex">
                <CountryCodeDropdown
                  value={countryCode}
                  onChange={setCountryCode}
                />
                <input
                  type="tel"
                  id="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 border-l-0 rounded-r-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6 font-poppins flex items-center">
              <Building2 className="w-5 h-5 mr-3 text-[#FFC107]" />
              Company Information
            </h2>

            {/* Company Logo */}
            <div className="mb-6">
              <Label className="block text-sm font-medium text-gray-300 mb-2">
                Company Logo
              </Label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                  {formData.companyLogoUrl ? (
                    <img 
                      src={formData.companyLogoUrl} 
                      alt="Company logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="companyLogo"
                    accept="image/*"
                    onChange={handleCompanyLogoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="companyLogo"
                    className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Logo</span>
                  </label>
                  <p className="text-gray-400 text-sm mt-2">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <Label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name
                </Label>
                <input
                  type="text"
                  id="companyName"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                  placeholder="Enter company name"
                />
              </div>

              {/* Industry */}
              <div>
                <Label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-2">
                  Industry
                </Label>
                <select
                  id="industry"
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white"
                >
                  <option value="" className="bg-neutral-800">Select industry</option>
                  <option value="Technology" className="bg-neutral-800">Technology</option>
                  <option value="Healthcare" className="bg-neutral-800">Healthcare</option>
                  <option value="Finance" className="bg-neutral-800">Finance</option>
                  <option value="Education" className="bg-neutral-800">Education</option>
                  <option value="Manufacturing" className="bg-neutral-800">Manufacturing</option>
                  <option value="Retail" className="bg-neutral-800">Retail</option>
                  <option value="Construction" className="bg-neutral-800">Construction</option>
                  <option value="Transportation" className="bg-neutral-800">Transportation</option>
                  <option value="Hospitality" className="bg-neutral-800">Hospitality</option>
                  <option value="Other" className="bg-neutral-800">Other</option>
                </select>
              </div>

              {/* Website Link */}
              <div>
                <Label htmlFor="websiteLink" className="block text-sm font-medium text-gray-300 mb-2">
                  Website Link
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="url"
                    id="websiteLink"
                    value={formData.websiteLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, websiteLink: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              {/* Company ID */}
              <div>
                <Label htmlFor="companyId" className="block text-sm font-medium text-gray-300 mb-2">
                  Company ID
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Enter company registration ID"
                  />
                </div>
              </div>
            </div>

            {/* Company Address */}
            <div className="mt-6">
              <Label htmlFor="companyAddress" className="block text-sm font-medium text-gray-300 mb-2">
                Company Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                <textarea
                  id="companyAddress"
                  required
                  value={formData.companyAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 resize-none"
                  placeholder="Enter complete company address"
                />
              </div>
            </div>
          </div>

          {/* Legal Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6 font-poppins flex items-center">
              <FileText className="w-5 h-5 mr-3 text-[#FFC107]" />
              Legal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manager / Legal Representative */}
              <div>
                <Label htmlFor="managerName" className="block text-sm font-medium text-gray-300 mb-2">
                  Manager / Legal Representative
                </Label>
                <input
                  type="text"
                  id="managerName"
                  value={formData.managerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                  placeholder="Enter manager/legal representative name"
                />
              </div>

              {/* Responsible Person */}
              <div>
                <Label htmlFor="responsiblePerson" className="block text-sm font-medium text-gray-300 mb-2">
                  Responsible Person
                </Label>
                <input
                  type="text"
                  id="responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                  placeholder="Enter responsible person name"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25 text-lg"
            >
              {loading ? 'Creating Company Profile...' : 'Complete Company Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}