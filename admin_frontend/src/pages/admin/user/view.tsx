import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Send,
  LogIn,
  ShieldCheck,
  Clock,
  Globe,
  Network,
  ShoppingCart,
  Heart,
  Plus,
} from "lucide-react";
import {
  getUserById,
  deleteUser,
  USERS_QUERY_KEY,
  autoLogin,
  sendTfaMail,
} from "@/services/user.service";
import {
  getUserDevices,
  getUserActivity,
  getUserMails,
  getUserCart,
  getUserWishlist,
  getUserAddresses,
  deleteUserAddress,
  removeFromCart,
  removeFromWishlist,
} from "@/services/user-details.service";
import { formatDateTime } from "@/lib/utils";
import AppConfig from "@/appConfig";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { SendMailDialog } from "./components/SendMailDialog";
import { AddressDialog } from "./components/AddressDialog";
import { useAuth } from "@/context/AuthContext";
import type { ColDef } from "ag-grid-community";
import { toast } from "sonner";

export default function UserView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [imageError, setImageError] = useState(false);

  const { deleteMutation } = useDeleteEntity(
    deleteUser,
    USERS_QUERY_KEY,
    "User",
  );

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      navigate("/admin/users", { replace: true });
    } catch (error) {
      // Error already handled by the hook
    }
  };

  const handleAutoLogin = async (userId: string) => {
    try {
      const response = await autoLogin(userId);
      if (response.status === 1 && response.data?.auth_token) {
        // Open user side dashboard in new tab with auth token
        window.open(
          `${AppConfig.FRONT_URL}dashboard?auth_token=${response.data.auth_token}`,
          "_blank",
        );
      } else {
        console.error("Auto login failed: Invalid response");
      }
    } catch (error) {
      console.error("Auto login failed:", error);
    }
  };

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => getUserById(id!),
    enabled: !!id,
  });

  // Fetch user devices
  const { data: devicesData = [], isLoading: isDevicesLoading } = useQuery({
    queryKey: ["user-devices", id],
    queryFn: () => getUserDevices(id!),
    enabled: !!id,
  });

  // Fetch user activity
  const { data: activityData = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ["user-activity", id],
    queryFn: () => getUserActivity(id!),
    enabled: !!id,
  });

  // Fetch user mails
  const { data: mailsData = [], isLoading: isMailsLoading } = useQuery({
    queryKey: ["user-mails", id],
    queryFn: () => getUserMails(id!),
    enabled: !!id,
  });

  // Fetch user cart
  const {
    data: cartData = null,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ["user-cart", id],
    queryFn: () => getUserCart(id!),
    enabled: !!id,
  });

  // Fetch user wishlist
  const {
    data: wishlistData = [],
    isLoading: isWishlistLoading,
    refetch: refetchWishlist,
  } = useQuery({
    queryKey: ["user-wishlist", id],
    queryFn: () => getUserWishlist(id!),
    enabled: !!id,
  });

  // Fetch user addresses
  const {
    data: addressesData = [],
    isLoading: isAddressesLoading,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ["user-addresses", id],
    queryFn: () => getUserAddresses(id!),
    enabled: !!id,
  });

  // Address dialog state
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const canEdit = hasPermission("admin/user/update");

  const isDetailsLoading =
    isDevicesLoading || isActivityLoading || isMailsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Failed to load user"}
          </p>
          <Link to="/admin/users">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-yellow-600">User not found</p>
          <Link to="/admin/users">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isActive = user.status === 1;

  // Column Definitions for Recent Devices
  const devicesColumns: ColDef[] = [
    {
      headerName: "Browser",
      field: "type",
      flex: 1,
      cellRenderer: (params: any) => {
        const typeMap: Record<number, string> = {
          0: "IOS",
          1: "Android",
        };
        return <strong>{typeMap[params.value] || "Web"}</strong>;
      },
    },
    { headerName: "Device", field: "device_uid", flex: 1 },
    { headerName: "Location", field: "ip", flex: 1.5 },
    {
      headerName: "Recent Activities",
      field: "created_at",
      flex: 1,
      cellRenderer: (params: any) => formatDateTime(params.value),
    },
  ];

  // Column Definitions for Recent Activity
  const activityColumns: ColDef[] = [
    {
      headerName: "Browser",
      field: "type",
      flex: 1,
      cellRenderer: (params: any) => {
        const typeMap: Record<number, string> = {
          0: "Login Fail",
          1: "Login Success",
          2: "Login By Remember",
          3: "Register",
          4: "Login With Otp",
          5: "Login With Social Media",
          6: "Register With Social Media",
        };
        return <strong>{typeMap[params.value] || params.value}</strong>;
      },
    },
    { headerName: "Device", field: "client", flex: 2 },
    { headerName: "IP", field: "ip", flex: 1.5 },
    {
      headerName: "Recent Activities",
      field: "created_at",
      flex: 1,
      cellRenderer: (params: any) => formatDateTime(params.value),
    },
  ];

  // Column Definitions for Sent Mails
  const mailsColumns: ColDef[] = [
    { headerName: "To", field: "to_user", flex: 1 },
    { headerName: "Subject", field: "subject", flex: 1.5 },
    { headerName: "Message", field: "message", flex: 1 },
    {
      headerName: "Sent Date",
      field: "created_at",
      flex: 1,
      cellRenderer: (params: any) => formatDateTime(params.value),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
        <Link to="/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {hasPermission("admin/user/update") && (
                <Link to={`/admin/user/update/${user.id}`}>
                  <Button size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              )}
              {hasPermission("admin/user") && (
                <ConfirmationDialog
                  title="Delete User"
                  description="Are you sure you want to delete this user?"
                  confirmText="Delete"
                  cancelText="Cancel"
                  onConfirm={handleDelete}
                >
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </ConfirmationDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image and Details */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className=" flex justify-center md:justify-start">
              {user.image && !imageError ? (
                <img
                  src={`${AppConfig.API_URL}upload/user_profile/${user.image}`}
                  alt={user.first_name}
                  className="h-32 w-32 rounded-full border-4 border-gray-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="h-32 w-32 rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center  text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            {/* User Details Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Username
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">{user.phone || "N/A"}</p>
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Country
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {user.country || "N/A"}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={isActive ? "success" : "destructive"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {/* Time Zone */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Time Zone
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {user.timezone || "N/A"}
                  </p>
                </div>
              </div>

              {/* Registered IP */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Registered IP
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Network className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {user.registered_ip || "N/A"}
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created At
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {formatDateTime(user.createdAt || user.created_at)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Updated At
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {formatDateTime(user.updated_at)}
                  </p>
                </div>
              </div>
              {/* Buttons Row */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Actions
                </label>
                <div className="flex gap-2 mt-1">
                  {hasPermission("admin/user/autologin") && (
                    <Button
                      onClick={() => handleAutoLogin(user.id)}
                      size="sm"
                      title="Login as User"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login as User
                    </Button>
                  )}

                  {hasPermission("admin/user/send-tfa-mail") && (
                    <Button
                      onClick={async () => {
                        try {
                          await sendTfaMail(user.id);
                          toast.success("TFA mail sent successfully");
                        } catch (error) {
                          console.error("Send TFA mail failed:", error);
                          toast.error("Failed to send TFA mail");
                        }
                      }}
                      size="sm"
                      title="Re-send Verification Mail"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Re-send Verification Mail
                    </Button>
                  )}

                  <SendMailDialog userEmail={user.email}>
                    <Button size="sm">
                      <Send className="mr-2 h-4 w-4" />
                      Send Mail
                    </Button>
                  </SendMailDialog>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              User Addresses
            </CardTitle>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingAddress(null);
                  setAddressDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isAddressesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : addressesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No addresses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addressesData.map((address: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg relative">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {address.fullName || "N/A"}
                      </p>
                      <p className="text-sm">{address.phone || "N/A"}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.country}
                      </p>
                      {address.isDefault && (
                        <Badge variant="default" className="mt-2">
                          Default
                        </Badge>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingAddress(address);
                            setAddressDialogOpen(true);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                        <ConfirmationDialog
                          title="Delete Address"
                          description="Are you sure you want to delete this address?"
                          confirmText="Delete"
                          cancelText="Cancel"
                          onConfirm={async () => {
                            try {
                              await deleteUserAddress(id!, address._id);
                              refetchAddresses();
                              toast.success("Address deleted successfully");
                            } catch (error) {
                              toast.error("Failed to delete address");
                            }
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </ConfirmationDialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {isDetailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              rowData={devicesData}
              columnDefs={devicesColumns}
              perPage={10}
            />
          )}
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isDetailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              rowData={activityData}
              columnDefs={activityColumns}
              perPage={10}
            />
          )}
        </CardContent>
      </Card>

      {/* Sent Mails Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sent Mails</CardTitle>
        </CardHeader>
        <CardContent>
          {isDetailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              rowData={mailsData}
              columnDefs={mailsColumns}
              perPage={10}
            />
          )}
        </CardContent>
      </Card>

      {/* Cart and Wishlist - Tabs */}
      <Tabs defaultValue="cart" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cart">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            <Heart className="w-4 h-4 mr-2" />
            Wishlist
          </TabsTrigger>
        </TabsList>

        {/* Cart Tab */}
        <TabsContent value="cart">
          <Card>
            <CardHeader>
              <CardTitle>User Cart</CardTitle>
            </CardHeader>
            <CardContent>
              {isCartLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !cartData || cartData.items?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">
                      {cartData.items.length} items in cart
                    </p>
                    <p className="text-sm font-bold">
                      Total: ₹
                      {cartData.items
                        .reduce(
                          (s: number, i: any) => s + i.price * i.quantity,
                          0,
                        )
                        .toLocaleString("en-IN")}
                    </p>
                  </div>
                  {cartData.items.map((item: any) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 p-3 border border-border rounded-xl"
                    >
                      {item.image && (
                        <img
                          src={`${AppConfig.API_URL}${item.image}`}
                          className="w-12 h-12 object-contain bg-muted rounded-lg"
                          alt={item.name}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × ₹
                          {item.price?.toLocaleString("en-IN")}
                          {item.variant &&
                            ` • ${Object.values(item.variant).filter(Boolean).join(" / ")}`}
                        </p>
                      </div>
                      <p className="font-bold text-sm">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              await removeFromCart(
                                id!,
                                item.productId || item.product,
                              );
                              refetchCart();
                              toast.success("Removed from cart");
                            } catch {
                              toast.error("Failed to remove from cart");
                            }
                          }}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist">
          <Card>
            <CardHeader>
              <CardTitle>User Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              {isWishlistLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : wishlistData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Wishlist is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {wishlistData.map((product: any) => (
                    <div
                      key={product._id}
                      className="border border-border rounded-xl p-3"
                    >
                      {product.images?.[0] && (
                        <img
                          src={`${AppConfig.API_URL}${product.images[0]}`}
                          className="w-full h-28 object-contain bg-muted rounded-lg mb-2"
                          alt={product.name}
                        />
                      )}
                      <p className="font-semibold text-sm line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold mt-1">
                        ₹
                        {(product.salePrice || product.price)?.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 text-destructive border-destructive/30"
                          onClick={async () => {
                            try {
                              await removeFromWishlist(id!, product._id);
                              refetchWishlist();
                              toast.success("Removed from wishlist");
                            } catch {
                              toast.error("Failed to remove from wishlist");
                            }
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Address Dialog */}
      <AddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        address={editingAddress}
        userId={id!}
        onSuccess={() => {
          refetchAddresses();
          setAddressDialogOpen(false);
          setEditingAddress(null);
        }}
      />
    </div>
  );
}
