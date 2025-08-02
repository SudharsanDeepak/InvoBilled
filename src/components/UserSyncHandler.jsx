import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { api } from "../service/invoiceService";

const UserSyncHandler = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const saveUser = async () => {
      // Only proceed if user is loaded, signed in, and not already synced
      if (!isLoaded || !isSignedIn || synced || !window.Clerk?.session) {
        return;
      }

      try {
        // Make sure we have a valid session
        const token = await getToken();
        if (!token) {
          console.warn('No authentication token available for user sync');
          return;
        }

        const userData = {
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          photoUrl: user.imageUrl || '',
        };

        // Use the API client which handles auth headers automatically
        const response = await api.post("/users", userData);
        
        if (response.status >= 200 && response.status < 300) {
          console.log('User synced successfully');
          setSynced(true);
        }
      } catch (error) {
        console.error("User sync failed:", error);
        
        // Don't show error for 409 (user already exists) or 403 (forbidden)
        if (error.response?.status !== 409 && error.response?.status !== 403) {
          console.log("Error during user sync:", error);
        }
        
        // Still mark as synced to prevent repeated failed attempts
        setSynced(true);
      }
    };

    // Only attempt to sync if we have a valid user session
    const checkAndSync = async () => {
      try {
        const token = await getToken();
        if (token) {
          saveUser();
        } else {
          // If no token, wait a bit and try again
          const timer = setTimeout(() => {
            checkAndSync();
          }, 1000);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    const timer = setTimeout(() => {
      checkAndSync();
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, user, synced, getToken]);

  return null;
};

export default UserSyncHandler;
