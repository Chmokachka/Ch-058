package com.shrralis.ssdemo1.configuration;

import com.shrralis.ssdemo1.repository.UsersRepository;
import com.shrralis.ssdemo1.service.SocialService;
import com.shrralis.ssdemo1.service.SpringSecuritySignInAdapter;
import com.shrralis.ssdemo1.service.UserConnectionServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.social.UserIdSource;
import org.springframework.social.config.annotation.ConnectionFactoryConfigurer;
import org.springframework.social.config.annotation.EnableSocial;
import org.springframework.social.config.annotation.SocialConfigurer;
import org.springframework.social.connect.ConnectionFactoryLocator;
import org.springframework.social.connect.ConnectionSignUp;
import org.springframework.social.connect.UsersConnectionRepository;
import org.springframework.social.connect.jdbc.JdbcUsersConnectionRepository;
import org.springframework.social.connect.web.*;
import org.springframework.social.facebook.connect.FacebookConnectionFactory;
import org.springframework.social.google.connect.GoogleConnectionFactory;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import javax.sql.DataSource;
import java.util.UUID;

@Configuration
@EnableSocial
public class SocialConfig implements SocialConfigurer {

    private final DataSource dataSource;
    private final ConnectionSignUp connectionSignUp;

    @Autowired
    public SocialConfig(ConnectionSignUp connectionSignUp, DataSource dataSource) {
        this.connectionSignUp = connectionSignUp;
        this.dataSource = dataSource;
    }

    @Override
    public void addConnectionFactories(ConnectionFactoryConfigurer connectionFactoryConfigurer, Environment environment) {
        FacebookConnectionFactory facebookConnectionFactory = new FacebookConnectionFactory(
                environment.getRequiredProperty("facebook.appKey"),
                environment.getRequiredProperty("facebook.appSecret"));
        facebookConnectionFactory.setScope("public_profile,email");
        GoogleConnectionFactory googleConnectionFactory = new GoogleConnectionFactory(
                        environment.getRequiredProperty("google.appKey"),
                        environment.getRequiredProperty("google.appSecret"));
        googleConnectionFactory.setScope("profile email");
        connectionFactoryConfigurer.addConnectionFactory(facebookConnectionFactory);
        connectionFactoryConfigurer.addConnectionFactory(googleConnectionFactory);
    }

    @Override
    public UserIdSource getUserIdSource() {
        return new SessionIdUserIdSource();
    }

    @Override
    public UsersConnectionRepository getUsersConnectionRepository(ConnectionFactoryLocator connectionFactoryLocator) {
        JdbcUsersConnectionRepository usersConnectionRepository =
                new JdbcUsersConnectionRepository(dataSource, connectionFactoryLocator, Encryptors.noOpText());
        usersConnectionRepository.setConnectionSignUp(connectionSignUp);
        return usersConnectionRepository;
    }

    @Bean
    public ProviderSignInController providerSignInController(
            ConnectionFactoryLocator connectionFactoryLocator,
            UsersConnectionRepository usersConnectionRepository,
            SpringSecuritySignInAdapter adapter/*, SocialInterceptor socialInterceptor*/) {
        ProviderSignInController psic =  new ProviderSignInController(
                connectionFactoryLocator,
                usersConnectionRepository,
                adapter);
        psic.setPostSignInUrl("http://localhost:8081/#/");
        return psic;
    }

    @Bean
    public ProviderSignInUtils providerSignInUtils(ConnectionFactoryLocator connectionFactoryLocator,
                                                   UsersConnectionRepository connectionRepository) {
        return new ProviderSignInUtils(connectionFactoryLocator, connectionRepository);
    }



    private static final class SessionIdUserIdSource implements UserIdSource {
        @Override
        public String getUserId() {
            RequestAttributes request = RequestContextHolder.currentRequestAttributes();
            String uuid = (String) request.getAttribute("_socialUserUUID", RequestAttributes.SCOPE_SESSION);
            if (uuid == null) {
                uuid = UUID.randomUUID().toString();
                request.setAttribute("_socialUserUUID", uuid, RequestAttributes.SCOPE_SESSION);
            }
            return uuid;
        }
    }

}