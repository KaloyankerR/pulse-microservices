import { useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { signIn } from 'next-auth/react';

import ColorUtils from '@/base/colors';

import useRegisterModal from '@/hooks/useRegisterModal';
import useLoginModal from '@/hooks/useLoginModal';
import { useHybridAuth } from '@/hooks/useHybridAuth';
import { useAuth } from '@/hooks/useAuth';

import Modal from '@/components/shared/Modal';
import Input from '@/components/shared/Input';
import Loading from '@/components/shared/Loading';
import GoogleButton from '@/components/shared/GoogleButton';

import { validateEmail } from '@/utils/helpers';
import { Router } from 'next/router';

const RegisterModal = () => {
  const registerModal = useRegisterModal();
  const loginModal = useLoginModal();
  const { register, microservicesEnabled } = useHybridAuth();
  const { register: authRegister } = useAuth();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [username, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmed, setPasswordConfirmed] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const [usernameError, setUsernameError] = useState<boolean>(false);

  const clearInputs = () => {
    setName('');
    setEmail('');
    setUserName('');
    setPassword('');
    setPasswordConfirmed('');
  };

  const inputControl = () => {
    return (
      !name ||
      !username ||
      !email ||
      !password ||
      !passwordConfirmed ||
      !validateEmail(email) ||
      !!usernameError
    );
  };

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);

      if (passwordConfirmed.localeCompare(password) !== 0) {
        toast.error("Passwords doesn't match!");
        return false;
      }

      // Split name into firstName and lastName
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Use new API client authentication when microservices are enabled
      if (microservicesEnabled) {
        await authRegister({
          username,
          email,
          password,
          firstName,
          lastName,
        });
        clearInputs();
        registerModal.onClose();
      } else {
        // Use hybrid authentication for Next.js
        const result = await register({
          username,
          email,
          password,
          firstName,
          lastName,
        });

        if (result?.success) {
          clearInputs();
          loginModal.onOpen();
          registerModal.onClose();
        }
      }
    } catch (err: any) {
      toast.error(`Something went wrong! ${err.message}`, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [
    loginModal,
    registerModal,
    register,
    authRegister,
    microservicesEnabled,
    email,
    username,
    name,
    password,
    passwordConfirmed,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (registerModal.isOpen && username.length > 0) {
        try {
          let data;
          if (microservicesEnabled) {
            // Use microservice API
            const { apiClient } = await import('@/libs/api-client');
            data = await apiClient.checkUsername(username);
          } else {
            // Use Next.js API
            const response = await axios.get(
              `/api/users/check-username?username=${username}`
            );
            data = response.data;
          }

          if (data.exists || !data.available) {
            setUsernameError(true);
          } else {
            setUsernameError(false);
          }
        } catch (err: any) {
          console.error('Data fetch error', err);
          setUsernameError(false);
        }
      } else {
        setUsernameError(false);
      }

      if (registerModal.isOpen) {
        window.history.pushState(null, '', '/register');
      } else {
        window.history.pushState(null, '', '/');
      }
    };
    fetchData();
  }, [username, registerModal.isOpen, microservicesEnabled]);

  const handleFooterClick = () => {
    loginModal.onOpen();
    registerModal.onClose();
  };

  const bodyContent = (
    <div className='flex flex-col gap-4'>
      {/* Authentication System Indicator */}
      {microservicesEnabled && (
        <div className='text-center p-2 bg-green-900/20 rounded-lg border border-green-600/30'>
          <p className='text-sm text-green-400'>
            🚀 Using Microservices Registration
          </p>
        </div>
      )}
      
      {/* Google Login Button */}
      <GoogleButton />

      {/* Divider */}
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-gray-600' />
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='px-2 bg-black text-gray-400'>
            Or create account with email
          </span>
        </div>
      </div>

      {/* Email Registration Form */}
      <div className='flex flex-col gap-3'>
        <Input
          type='text'
          placeholder='Enter ur name'
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Input
          type='email'
          placeholder='Enter ur email'
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <Input
          type='text'
          placeholder='Enter ur username'
          value={username}
          onChange={e => setUserName(e.target.value)}
        />
        {username.length > 0 && usernameError && (
          <p style={{ color: ColorUtils.colors.red }}>
            Username is already taken
          </p>
        )}
        {username.length > 0 && !usernameError && (
          <p style={{ color: ColorUtils.colors.green }}>
            Username is available
          </p>
        )}
        <Input
          type='password'
          placeholder='Enter ur password'
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Input
          type='password'
          placeholder='Enter ur password again'
          value={passwordConfirmed}
          onChange={e => setPasswordConfirmed(e.target.value)}
        />
      </div>
    </div>
  );

  const footerContent = (
    <p className='text-white'>
      <span className='mr-2'>Have you an account?</span>
      <a
        className='hover:underline cursor-pointer'
        style={{ color: ColorUtils.colors.main }}
        onClick={handleFooterClick}
      >
        Login
      </a>
    </p>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <Modal
      isOpen={registerModal.isOpen}
      onClose={registerModal.onClose}
      onSubmit={handleSubmit}
      actionLabel='Create an account'
      title='Create an account'
      body={bodyContent}
      footer={footerContent}
      disabled={inputControl()}
    />
  );
};

export default RegisterModal;
