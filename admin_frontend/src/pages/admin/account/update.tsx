import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'

import { AccountBlock } from './component/account_block'
import { ProfileImageUpload } from './component/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'

export default function Update() {
  const { user, updateUser } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()


  interface FormData {
    firstName: string
    lastName: string
    email: string
    phone: string
  }

  const defaultValues = useMemo(
    () => ({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }),
    [user]
  )

  const form = useForm<FormData>({
    defaultValues,
  })

  const { control, reset } = form

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user, reset])

 const handleImageChange = (file: File | null) => {
  if (!file || !user) return;

  authService.uploadImage(file, user.user_id).then(resp => {
    if (resp.status === 1) {
      updateUser({ ...user, image: resp.data.image });
    }
  });
};

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsSubmitting(true)

    try {
    
      const payload = {
        userId: user.user_id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
      }

      const resp = await authService.updateProfile(payload)

      if (resp.status === 1) {
        updateUser({
          ...user,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
        })

        if (resp.next === 'redirect' && resp.url) {
          toast.success(resp.message || 'Account updated, verification required.')
          navigate(resp.url.startsWith('/') ? resp.url : '/' + resp.url)
        } else {
          toast.success(resp.message || 'Profile updated successfully!')
        }
      }
    } catch {
      toast.error('An error occurred while updating profile')
    } finally {
      setIsSubmitting(false)
    }
  }





  return (
    <>
      <AccountBlock />
      <div className="flex-1 flex flex-col mt-6 sm:mt-9 sm:px-10">
        {/* UPDATE PROFILE */}
        <Card className="mb-6 w-full p-0">
          <div className="p-8 pb-4 border-b">
            <ProfileImageUpload onChange={handleImageChange} />
          </div>

          <div className="p-8 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          First Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Last Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Phone <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-8 flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button type="reset" variant="secondary">
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Card>

      </div>
    </>
  )
}
