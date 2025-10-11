import React, { useCallback, useEffect, useState } from 'react';

import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';

import ColorUtils from '@/base/colors';

import useLoginModal from '@/hooks/useLoginModal';
import useRegisterModal from '@/hooks/useRegisterModal';
import { useSpringBootAuth } from '@/hooks/useSpringBootAuth';
import { useAuth } from '@/hooks/useAuth';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

import Modal from '@/components/shared/Modal';
import Input from '@/components/shared/Input';
import Loading from '@/components/shared/Loading';
import GoogleButton from '@/components/shared/GoogleButton';

const LoginModal = () => {
  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const springBootAuth = useSpringBootAuth();
  const { login: authLogin } = useAuth();

  const [loginInput, setLoginInput] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);

      if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
        // Use new API client authentication
        await authLogin({
          usernameOrEmail: loginInput,
          password,
        });
        toast.success('Successfully logged in!');
        loginModal.onClose();
      } else {
        // Use NextAuth
        const result = await signIn('credentials', {
          loginInput,
          password,
          redirect: false,
        });

        if (result?.ok) {
          toast.success('Successfully logged in!');
          loginModal.onClose();
        } else {
          toast.error('Login failed');
        }
      }
    } catch (error: any) {
      toast.error('Something went wrong! ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [loginModal, loginInput, password, authLogin]);

  useEffect(() => {
    return () => {
      setLoginInput('');
      setPassword('');
    };
  }, []);

  if (loading) return <Loading />;

  const handleFooterClick = () => {
    loginModal.onClose();
    registerModal.onOpen();
  };

  const bodyContent = (
    <div className='flex flex-col gap-4'>
      {/* Authentication System Indicator */}
      {MICROSERVICES_CONFIG.MICROSERVICES_ENABLED && (
        <div className='text-center p-2 bg-blue-900/20 rounded-lg border border-blue-600/30'>
          <p className='text-sm text-blue-400'>
            🚀 Using Microservices Authentication
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
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <div className='flex flex-col gap-3'>
        <Input
          type={'text'}
          placeholder={'Email or Username'}
          value={loginInput}
          onChange={e => setLoginInput(e.target.value)}
        />
        <Input
          type={'password'}
          placeholder={'Password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
    </div>
  );
  const footerContent = (
    <p className='text-white'>
      <span className='mr-2'>Don&apos;t have an account?</span>
      <a
        className='hover:underline cursor-pointer'
        style={{ color: ColorUtils.colors.main }}
        onClick={handleFooterClick}
      >
        Sign up
      </a>
    </p>
  );

  return (
    <Modal
      isOpen={loginModal.isOpen}
      onClose={loginModal.onClose}
      onSubmit={handleSubmit}
      title={'Login'}
      body={bodyContent}
      footer={footerContent}
      actionLabel={'Login'}
      disabled={!loginInput || !password}
    />
  );
};

export default LoginModal;
