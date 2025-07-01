import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'push_subscription' })
export class PushSubscription {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64 })
  auth0UserId: string;

  @Column({ nullable: false })
  endpoint: string; // example: https://updates.push.services.mozilla.com/wpush/v2/gAAAAABoXMw7SMOlv-7lxYsxvz6qIK7vs3IUqRKQa70wh4lzpC_ZWZJMeNnh7Gq3NHmS0KIlMrSON-rA9rD6k4BF4ty44V7I_TzeVNCeDkHFHgRKtUr49bRxG7NjKvZKPBTEwdLjweGcBj_KgkS33t1JMu_5YafPE1T7JVgiBBHDorcSPGYSOFs

  @Column({ nullable: false })
  p256dhKey: string; // example: BOhm44ZRLt1Ewos8iXI5wa9moyg3CVcmwfIQ_5IOcWH1mCzu-0B4nQ-2K_HWFYZC2L4pt35NBq36AMQSp8v318o

  @Column({ nullable: false })
  authKey: string; // example: OjwAnbaiOnFIdcxaW33ArA

}
