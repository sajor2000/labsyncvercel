"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./dialog"
import { Button } from "./button-enhanced"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'email' | 'number' | 'select'
  required?: boolean
  placeholder?: string
  options?: string[] // For select fields
  defaultValue?: any
}

export interface CrudDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  fields: FormField[]
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => Promise<void>
  loading?: boolean
  error?: string | null
  submitLabel?: string
}

export function CrudDialog({
  isOpen,
  onClose,
  title,
  description,
  fields,
  initialData = {},
  onSubmit,
  loading = false,
  error = null,
  submitLabel = "Save"
}: CrudDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData)
      setErrors({})
    }
  }, [isOpen, initialData])

  // Handle field change
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Render field based on type
  const renderField = (field: FormField) => {
    const value = formData[field.id] || field.defaultValue || ''
    const hasError = !!errors[field.id]

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {field.type === 'textarea' ? (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? "border-destructive" : ""}
          />
        ) : field.type === 'select' ? (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          >
            <SelectTrigger className={hasError ? "border-destructive" : ""}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={field.id}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? "border-destructive" : ""}
          />
        )}
        
        {hasError && (
          <div className="flex items-center space-x-1 text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">{errors[field.id]}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(renderField)}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={loading}
            onClick={handleSubmit}
            disabled={Object.keys(errors).length > 0}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CrudDialog